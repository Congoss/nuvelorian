import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { build } from 'esbuild';

// Exercise Game's real navigation handlers and rendered scene tree, without
// mounting API-dependent game panels or running a browser.
const bundled = await build({
  entryPoints: ['src/pages/Game.jsx'], bundle: true, write: false,
  platform: 'node', format: 'cjs', jsx: 'automatic', define:{'import.meta.env.DEV':'false'},
  plugins: [{ name: 'navigation-panels', setup(builder) {
    builder.onResolve({ filter: /.*/ }, args => args.kind === 'entry-point'
      ? undefined : { path: args.path, namespace: 'navigation-mock' });
    builder.onLoad({ filter: /.*/, namespace: 'navigation-mock' }, ({ path }) => {
      let contents;
      if (path === 'react') contents = `
        export const useState = globalThis.navigation.useState;
        export const useRef = value => useState({current:value})[0];
        export const useCallback = callback => callback;
        export const useMemo = callback => callback();
        export const useEffect = () => {};
        export const Suspense = props => props.children;
        export const lazy = loader => {
          let component;
          globalThis.navigation.loads.push(loader().then(module => component = module.default));
          return props => component(props);
        };`;
      else if (path === 'react/jsx-runtime') contents = `
        export const jsx = globalThis.navigation.jsx;
        export const jsxs = jsx;
        export const Fragment = props => props.children;`;
      else if (path === 'framer-motion') contents = 'export const MotionConfig = props => props.children;';
      else if(path.endsWith('/achievementClaim')) contents='export const claimAchievement=async()=>({});';
      else if(path.endsWith('/useAchievementLanguage')) contents='export const ViewerLanguageContext={Provider:p=>p.children};export const AchievementClaimContext={Provider:p=>p.children};';
      else if(path.endsWith('/chatReadState')) contents='export const chatIndicators=()=>({});export const CHAT_READ_EVENT="chat-read";';
      else if(path.endsWith('/useClanQuestNotifications')) contents='export const useClanQuestNotifications=()=>{};';
      else if (path.endsWith('/useGameState')) contents = 'export const useGameState = () => globalThis.navigation.gameState;';
      else if (path.endsWith('/useStartupLoadingManager')) contents = 'export const useStartupLoadingManager = () => ({loadingProgress:100, loadingVisible:false});';
      else if (path.endsWith('/animationPreference')) contents = 'export const useGlobalAnimations = () => true;';
      else if (path.endsWith('/gameConfig')) contents = 'export const GAME_CONFIG = {CONTENT_UNLOCK_LEVELS:{}};';
      else if (path.endsWith('/backgrounds')) contents = 'export const getCampBackgroundById = () => ({source:"background"});';
      else if (path.endsWith('/tutorialProgress.js')) contents = 'export const TUTORIAL_STEPS = new Set(); export const resolveTutorialStep = () => null; export const FIRST_QUEST_TUTORIAL_ENERGY = 231; export const getQuestTutorialRecoveryStep = () => null; export const isNewbieTutorialActive = () => false;';
      else if (path.endsWith('/gameApi')) contents = 'export const findPlayerProfiles = async () => []; export const listChatMessages = async () => []; export const gameApi = {};';
      else if (path.endsWith('/clanOverviewQueries')) contents = 'export const clanOverviewQueries = () => [];';
      else if (path.endsWith('/query-client')) contents = 'export const queryClientInstance = { prefetchQuery: async () => {}, getQueryData: () => undefined };';
      else if (path.endsWith('/sceneAssets')) contents = 'export const warmSceneImage = async () => {}; export const warmFirstFrameImages = async () => {}; export const isSceneImageReady = () => true;';
      else if (path.endsWith('/appVersion')) contents = 'export const APP_VERSION_LABEL = "TEST";';
      else if (path.endsWith('/resourceIcons')) contents = 'export const getResourceIcon = () => "resource";';
      else if (path.endsWith('/caRanks')) contents = 'export const CA_RANKS = []; export const getCARankProgress = () => ({current:0,next:null}); export const getCARankIcon = () => "rank"; export const getPlayerCA = () => 0;';
      else if (path.endsWith('/caRankRewards')) contents = 'export const getPendingCARankRewards = () => []; export const getCARankReward = () => null;';
      else if (path.endsWith('/ui/button')) contents = 'export const Button = props => globalThis.navigation.jsx("button", props);';
      else if (/\.(png|webp|gif|svg)$/.test(path)) contents = 'export default "asset";';
      else contents = `export default props => globalThis.navigation.jsx(${JSON.stringify(path.split('/').at(-1))}, props);`;
      return { contents, loader: 'js' };
    });
  }}],
});

function createGame() {
  const state = [];
  let cursor = 0;
  const navigation = {
    loads: [], jsx: (type, props) => ({type, props: props || {}}),
    useState(initial) {
      const index = cursor++;
      if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial;
      return [state[index], value => { state[index] = typeof value === 'function' ? value(state[index]) : value; }];
    },
    gameState: {
      profile: {id:'player', level:30, language:'uk', clan_id:'clan', tutorial_disabled:true},
      bootStage:'ready', loading:false,
      updateProfile:async () => {}, refreshProfile:async () => {}, syncProfile:() => {},
    },
  };
  const context = vm.createContext({module:{exports:{}}, exports:{}, navigation, console, URLSearchParams});
  vm.runInContext(bundled.outputFiles[0].text, context);
  const Game = context.module.exports.default;
  function expand(node) {
    if (Array.isArray(node)) return node.flatMap(expand);
    if (!node || typeof node !== 'object') return [];
    if (typeof node.type === 'function') return expand(node.type(node.props));
    return [node, ...expand(node.props.children)];
  }
  return {
    ready: () => Promise.all(navigation.loads),
    render() { cursor = 0; return expand(Game()); },
  };
}

test('repeat fishing → events → raid → events without a camp scene or modal underneath', async () => {
  const game = createGame();
  await game.ready();
  const get = (nodes, type) => {
    const node = nodes.find(node => node.type === type);
    assert.ok(node, `Missing ${type}`);
    return node.props;
  };
  get(game.render(), 'CampView').onOpenModal('events');
  for (let cycle = 0; cycle < 6; cycle++) {
    for (const next of ['onOpenSpaceFishing', 'onOpenRaidBoss']) {
      const listNodes = game.render();
      assert.equal(listNodes.some(node => node.type === 'CampView'), false, 'Camp must not intercept event cards');
      assert.equal(listNodes.find(node => 'data-modal-open' in node.props).props['data-modal-open'], false);
      const list = get(listNodes, 'DailyPanel');
      assert.equal(list.panelMode, 'events');
      assert.equal(list.initialEventScene, null);
      list[next]();
      const eventNodes = game.render();
      const event = get(eventNodes, next === 'onOpenRaidBoss' ? 'BossPanel' : 'DailyPanel');
      if (next === 'onOpenRaidBoss') assert.equal(event.raidMode, true);
      else assert.equal(event.initialEventScene, 'space-fishing');
      event.onBackToEvents();
    }
  }
  get(game.render(), 'DailyPanel').onClose();
  assert.ok(game.render().some(node => node.type === 'CampView'));
});
