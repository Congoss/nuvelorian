import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import i18next from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { createServer } from 'vite';
test('awards button follows UI locale even when viewed profile uses Ukrainian', async()=>{
 const server=await createServer({server:{middlewareMode:true},appType:'custom'});
 try{
  const {ViewerLanguageContext,useAchievementLanguage}=await server.ssrLoadModule('/src/lib/useAchievementLanguage.js');
  const {PLAYER_ACHIEVEMENTS}=await server.ssrLoadModule('/src/lib/playerAchievements.js');
  const {default:Launcher}=await server.ssrLoadModule('/src/components/game/PlayerCollectionLauncher.jsx');
  for(const [language,label] of [['ru','Награды'],['en','Awards'],['uk','Нагороди']]){
   const instance=i18next.createInstance();await instance.init({lng:language,fallbackLng:'uk',resources:{uk:{translation:{}},ru:{translation:{}},en:{translation:{}}}});
   const markup=renderToStaticMarkup(React.createElement(I18nextProvider,{i18n:instance},React.createElement(Launcher,{language:'uk',onClick:()=>{}})));
   assert.ok(markup.includes(label),markup);
   // The viewer's language wins even if global i18n and the visited profile are Ukrainian.
   await instance.changeLanguage('uk');
   function PopupLanguageProbe(){const lang=useAchievementLanguage('uk');return React.createElement('span',null,PLAYER_ACHIEVEMENTS.find(item=>item.id==='hands_off')[lang][0]);}
   const ownLocaleMarkup=renderToStaticMarkup(React.createElement(I18nextProvider,{i18n:instance},React.createElement(ViewerLanguageContext.Provider,{value:language},React.createElement(React.Fragment,null,React.createElement(Launcher,{language:'uk',onClick:()=>{}}),React.createElement(PopupLanguageProbe)))));
   assert.ok(ownLocaleMarkup.includes(label),ownLocaleMarkup);
   assert.ok(ownLocaleMarkup.includes({ru:'Это уже без меня',en:'My Work Here Is Done',uk:'Це вже без мене'}[language]),ownLocaleMarkup);
  }
 }finally{await server.close();}
});
