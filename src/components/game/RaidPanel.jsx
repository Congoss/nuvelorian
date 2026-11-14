import CombatLoader from './CombatLoader';
import { translateUiText } from '@/lib/uiTextTranslations';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { GAME_CONFIG } from '@/lib/gameConfig';
import { listPlayerProfiles, resolveRaid } from '@/services/gameApi';
import { Crosshair, Shield, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export default function RaidPanel({ profile, user, onAddXp, onRefreshProfile }) {
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [attacking, setAttacking] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    loadTargets();
  }, [user]);

  const loadTargets = async () => {
    setLoading(true);
    const all = await listPlayerProfiles('-tentacles', 20);
    setTargets(all.filter((p) => p.created_by !== user?.email).slice(0, 8));
    setLoading(false);
  };

  const handleRaid = async (target, isRevenge = false) => {
    if (!profile || (profile.energy || 0) < GAME_CONFIG.RAID_ENERGY_COST) return;
    setAttacking(target.id);
    setResult(null);

    let raidResult;
    try {
      raidResult = await resolveRaid({
        attackerProfile: profile,
        attackerUser: user,
        targetProfile: target,
        isRevenge,
      });
    } catch (error) {
      setAttacking(null);
      return;
    }

    if (!raidResult.xpApplied) {
      await onAddXp(raidResult.xp || 0);
    }
    await onRefreshProfile?.();

    if (raidResult.success) {
      setResult({
        success: true,
        amount: raidResult.amount,
        target: raidResult.targetName || target.username,
      });
    } else {
      setResult({
        success: false,
        penalty: raidResult.penalty,
        target: raidResult.targetName || target.username,
      });
    }

    setAttacking(null);
    loadTargets();
    setTimeout(() => setResult(null), 4000);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-mono font-bold text-red-400 tracking-widest uppercase">{"" + translateUiText("⚔️ Рейд") + ""}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={loadTargets}
          className="h-6 text-[9px] font-mono text-muted-foreground"
        >
          <RefreshCw className="w-3 h-3 mr-1" />{" " + translateUiText("Скан") + " "}</Button>
      </div>

      <div className="bg-card border border-[#28ee90] rounded-lg p-2 text-center">
        <p className="text-[10px] font-mono text-muted-foreground">{" " + translateUiText("Рейд коштує") + " "}<span className="text-orange-400">{GAME_CONFIG.RAID_ENERGY_COST}⚡</span>{' '}{" " + translateUiText("| Краде") + " "}<span className="text-primary">10–20%</span>{" " + translateUiText("відкритого брухту") + " "}</p>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            className={`p-3 rounded-lg border text-center font-mono text-sm ${
              result.success
                ? 'bg-primary/10 border-primary/40 text-primary'
                : 'bg-red-900/20 border-red-700/40 text-red-400'
            }`}
          >
            {result.success ? (
              <div>
                <CheckCircle className="w-5 h-5 mx-auto mb-1" />
                <p>{"" + translateUiText("Рейд на") + " "}{result.target}{" " + translateUiText("успішний!") + ""}</p>
                <p className="text-lg font-bold">+{result.amount}{" " + translateUiText("брухту") + ""}</p>
              </div>
            ) : (
              <div>
                <XCircle className="w-5 h-5 mx-auto mb-1" />
                <p>{"" + translateUiText("Рейд на") + " "}{result.target}{" " + translateUiText("провалено!") + ""}</p>
                <p className="text-xs">{"" + translateUiText("Втрачено") + " "}{result.penalty}{" " + translateUiText("брухту") + ""}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center py-8">
          <CombatLoader/>
        </div>
      ) : targets.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground font-mono text-xs">{"" + translateUiText("Немає цілей. Грай перший!") + ""}</div>
      ) : (
        <div className="space-y-1.5 max-h-[350px] overflow-y-auto pr-1">
          {targets.map((target) => {
            const canRaid = (profile?.energy || 0) >= GAME_CONFIG.RAID_ENERGY_COST && !attacking;
            const isAttacking = attacking === target.id;

            return (
              <motion.div
                key={target.id}
                whileHover={{ scale: canRaid ? 1.01 : 1 }}
                className="bg-card border border-[#28ee90] rounded-lg p-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                      <span className="text-[11px] font-mono font-bold text-primary">
                        {(target.username || '?')[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-mono font-semibold text-foreground">{target.username}</p>
                      <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground">
                        <span>{"" + translateUiText("Рів.") + ""}{target.level || 1}</span>
                        <span className="flex items-center gap-0.5">
                          <Shield className="w-2.5 h-2.5" />
                          {target.defense_power || 5}
                        </span>
                        <span className="text-primary">{target.tentacles || 0}{" " + translateUiText("брухту") + ""}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    disabled={!canRaid || (target.tentacles || 0) === 0}
                    onClick={() => handleRaid(target)}
                    className="h-7 px-3 text-[10px] font-mono bg-red-900/30 border border-red-700/40 text-red-400 hover:bg-red-800/30"
                  >
                    {isAttacking ? (
                      <CombatLoader compact/>
                    ) : (
                      <>
                        <Crosshair className="w-3 h-3 mr-1" />
                        {translateUiText("РЕЙД")}
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
