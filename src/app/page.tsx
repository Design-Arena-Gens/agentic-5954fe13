/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type MoveType =
  | "Fire"
  | "Water"
  | "Electric"
  | "Grass"
  | "Psychic"
  | "Ice"
  | "Fairy"
  | "Normal"
  | "Rock"
  | "Flying"
  | "Poison"
  | "Fighting"
  | "Dragon"
  | "Dark"
  | "Ground";

type Move = {
  name: string;
  type: MoveType;
  power: number;
  accuracy: number;
  description: string;
};

type Pokemon = {
  name: string;
  hp: number;
  maxHp: number;
  sprite: string;
  accent: string;
  types: MoveType[];
  moves: Move[];
};

type AttackTrail = {
  startTop: number;
  endTop: number;
};

type AttackAnimation = {
  id: number;
  side: "left" | "right";
  move: Move;
  trails: AttackTrail[];
};

const TYPE_EFFECTIVENESS: Record<MoveType, Partial<Record<MoveType, number>>> =
  {
    Fire: { Grass: 2, Ice: 2, Water: 0.5, Fire: 0.5 },
    Water: { Fire: 2, Rock: 2, Grass: 0.5, Electric: 0.5 },
    Electric: { Water: 2, Flying: 2, Grass: 0.5, Electric: 0.5 },
    Grass: { Water: 2, Rock: 2, Fire: 0.5, Grass: 0.5 },
    Psychic: { Poison: 2, Fighting: 2, Psychic: 0.5 },
    Ice: { Grass: 2, Ground: 2, Fire: 0.5, Water: 0.5 },
    Fairy: { Dragon: 2, Dark: 2, Fire: 0.5 },
    Normal: {},
    Rock: {},
    Flying: {},
    Poison: {},
    Fighting: {},
    Dragon: {},
    Dark: {},
    Ground: {},
  };

const MOVE_GLYPHS: Record<MoveType, string[]> = {
  Fire: ["🔥", "✨", "🔥", "💥"],
  Water: ["💧", "🌊", "💧", "✨"],
  Electric: ["⚡️", "⚡️", "✨", "⚡️"],
  Grass: ["🍃", "🌱", "✨", "🍃"],
  Psychic: ["🔮", "✨", "💫", "🔮"],
  Ice: ["❄️", "✨", "❄️", "💎"],
  Fairy: ["✨", "🌸", "⭐️", "✨"],
  Normal: ["✨", "💫", "✨", "💥"],
  Rock: ["🪨", "✨", "💥", "🪨"],
  Flying: ["🕊️", "✨", "💨", "🕊️"],
  Poison: ["☠️", "💜", "☂️", "☠️"],
  Fighting: ["🥊", "💥", "✨", "🥊"],
  Dragon: ["🐉", "🔥", "✨", "🐉"],
  Dark: ["🌑", "💫", "✨", "🌙"],
  Ground: ["🌋", "🪨", "✨", "🌋"],
};

const STARTING_TEAM: { left: Pokemon; right: Pokemon } = {
  left: {
    name: "Auraflare",
    hp: 178,
    maxHp: 178,
    sprite: "/auraflare.svg",
    accent: "from-cyan-200 to-blue-500",
    types: ["Fairy", "Fire"],
    moves: [
      {
        name: "Solar Pulse",
        type: "Fire",
        power: 62,
        accuracy: 0.95,
        description: "Bathes the opponent in a flowing wave of solar fire.",
      },
      {
        name: "Lunar Gleam",
        type: "Fairy",
        power: 55,
        accuracy: 1,
        description: "A shimmering beam of moonlit particles.",
      },
      {
        name: "Ethereal Bloom",
        type: "Grass",
        power: 48,
        accuracy: 0.9,
        description: "Sprouts radiant petals that wrap the foe.",
      },
      {
        name: "Prismatic Shield",
        type: "Normal",
        power: 0,
        accuracy: 1,
        description: "Projects a prism shield that heals slight wounds.",
      },
    ],
  },
  right: {
    name: "Voltide",
    hp: 190,
    maxHp: 190,
    sprite: "/voltide.svg",
    accent: "from-amber-300 to-rose-500",
    types: ["Electric", "Water"],
    moves: [
      {
        name: "Storm Cascade",
        type: "Water",
        power: 58,
        accuracy: 0.95,
        description: "Crashes a spiralling torrent of charged water.",
      },
      {
        name: "Tempest Lance",
        type: "Electric",
        power: 65,
        accuracy: 0.9,
        description: "Launches a piercing jet of stormlight.",
      },
      {
        name: "Cryo Veil",
        type: "Ice",
        power: 45,
        accuracy: 0.95,
        description: "Shrouds the target in crystalline frost.",
      },
      {
        name: "Aqua Vitalize",
        type: "Water",
        power: 0,
        accuracy: 1,
        description: "A soothing mist restores vitality.",
      },
    ],
  },
};

const MOVE_COLOR: Record<MoveType, string> = {
  Fire: "from-amber-300 via-rose-400 to-orange-500",
  Water: "from-sky-300 via-blue-400 to-indigo-500",
  Electric: "from-yellow-200 via-amber-300 to-orange-400",
  Grass: "from-emerald-200 via-lime-300 to-emerald-500",
  Psychic: "from-fuchsia-200 via-violet-400 to-purple-500",
  Ice: "from-cyan-200 via-sky-200 to-indigo-400",
  Fairy: "from-pink-200 via-rose-300 to-purple-300",
  Normal: "from-slate-200 via-zinc-200 to-slate-300",
  Rock: "from-yellow-200 via-amber-200 to-stone-400",
  Flying: "from-sky-200 via-indigo-200 to-purple-300",
  Poison: "from-purple-200 via-violet-300 to-indigo-500",
  Fighting: "from-rose-200 via-orange-200 to-red-400",
  Dragon: "from-indigo-200 via-purple-300 to-rose-400",
  Dark: "from-slate-700 via-slate-800 to-slate-900",
  Ground: "from-amber-200 via-orange-200 to-yellow-400",
};

const RNG_MOD = 0x100000000;
const RNG_MULT = 1664525;
const RNG_INC = 1013904223;

type CSSVarStyle = React.CSSProperties & {
  "--start-left"?: string;
  "--end-left"?: string;
  "--start-top"?: string;
  "--end-top"?: string;
};

const calculateEffectiveness = (move: Move, defender: Pokemon) => {
  const baseEffect = defender.types.reduce((multiplier, type) => {
    const table = TYPE_EFFECTIVENESS[move.type];
    if (!table) return multiplier;
    const mod = table[type as MoveType];
    return multiplier * (mod ?? 1);
  }, 1);
  return baseEffect;
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const getMoveIconSet = (moveType: MoveType) => MOVE_GLYPHS[moveType] ?? ["✨"];

const formatHp = (pokemon: Pokemon) => `${pokemon.hp}/${pokemon.maxHp} HP`;

const isHealingMove = (move: Move) => move.power === 0;

const AttackStream = ({ animation }: { animation: AttackAnimation | null }) => {
  const glyphs = useMemo(() => {
    if (!animation) return [];
    const set = getMoveIconSet(animation.move.type);
    const count = animation.trails.length;
    return Array.from({ length: count }, (_, index) => set[index % set.length]);
  }, [animation]);

  if (!animation) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible">
      {glyphs.map((glyph, index) => {
        const trail = animation.trails[index] ?? { startTop: 50, endTop: 50 };
        const style: CSSVarStyle = {
          animationDelay: `${index * 60}ms`,
          "--start-left": "22%",
          "--end-left": "78%",
          "--start-top": `${trail.startTop}%`,
          "--end-top": `${trail.endTop}%`,
        };

        if (animation.side === "right") {
          style["--start-left"] = "22%";
          style["--end-left"] = "76%";
        }

        return (
          <span
            key={`${animation.id}-${index}`}
            className={`attack-icon ${
              animation.side === "left" ? "attack-icon--left" : "attack-icon--right"
            }`}
            style={style}
          >
            {glyph}
          </span>
        );
      })}
    </div>
  );
};

type PokemonPresenterProps = {
  pokemon: Pokemon;
  side: "left" | "right";
  isActive: boolean;
  statusText?: string;
};

const PokemonPresenter = ({
  pokemon,
  side,
  isActive,
  statusText,
}: PokemonPresenterProps) => {
  const hpPercent = Math.round((pokemon.hp / pokemon.maxHp) * 100);
  const isFainted = pokemon.hp <= 0;

  return (
    <div
      className={`relative flex w-full flex-col gap-3 rounded-4xl border border-white/20 bg-white/55 px-7 py-6 shadow-[0_20px_60px_-32px_rgba(15,23,42,.45)] backdrop-blur-2xl ${
        side === "left" ? "items-start" : "items-end"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex items-center gap-2 rounded-full border border-white/40 bg-white/60 px-4 py-1.5 text-sm font-medium uppercase tracking-[0.18em] text-slate-600 shadow-sm`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              isFainted ? "bg-rose-500" : "bg-emerald-400"
            }`}
          />
          {isFainted ? "Fainted" : isActive ? "Active" : "Standby"}
        </div>
        {statusText && (
          <span className="rounded-full bg-slate-900/5 px-4 py-1 text-xs uppercase tracking-[0.28em] text-slate-500">
            {statusText}
          </span>
        )}
      </div>

      <div
        className={`relative flex h-[180px] w-full items-center justify-${
          side === "left" ? "start" : "end"
        }`}
      >
        <div
          className={`glass-panel map-grid relative h-[160px] w-[160px] rounded-4xl border border-white/40 bg-gradient-to-br from-white/60 to-white/30 ${
            isActive ? "pokemon-active" : ""
          } ${isFainted ? "opacity-30 grayscale" : ""}`}
        >
          <div className="absolute -inset-3 rounded-[28px] bg-gradient-to-br from-white/60 via-white/0 to-white/10 blur-2xl" />
          <div
            className="absolute inset-0 rounded-[28px] bg-gradient-to-br opacity-70"
            style={{
              background:
                side === "left"
                  ? "linear-gradient(145deg, rgba(148,215,255,.35), rgba(88,132,255,.55))"
                  : "linear-gradient(215deg, rgba(255,214,165,.28), rgba(255,124,170,.55))",
            }}
          />
          <div className="relative flex h-full w-full items-center justify-center">
            <img
              src={pokemon.sprite}
              alt={pokemon.name}
              className={`h-[128px] w-[128px] origin-bottom transform rounded-3xl object-cover shadow-xl ${
                side === "right" ? "-scale-x-[1]" : ""
              }`}
            />
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col gap-3">
        <div className="flex w-full items-center justify-between">
          <div className="flex flex-col">
            <span className="text-2xl font-semibold tracking-tight text-slate-900">
              {pokemon.name}
            </span>
            <div className="mt-1 flex flex-wrap gap-2">
              {pokemon.types.map((type) => (
                <div
                  key={type}
                  className={`flex items-center gap-2 rounded-full bg-gradient-to-r ${MOVE_COLOR[type]} px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-900 shadow-[inset_0_1px_rgba(255,255,255,0.65)]`}
                >
                  <span>{getMoveIconSet(type)[0]}</span>
                  {type}
                </div>
              ))}
            </div>
          </div>
          <div className="text-right font-semibold tracking-wide text-slate-500">
            {formatHp(pokemon)}
          </div>
        </div>

        <div className="h-4 w-full rounded-full bg-white/40 shadow-inner shadow-white/50">
          <div
            className={`h-full rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-emerald-500 transition-all duration-500`}
            style={{ width: `${clamp(hpPercent, 0, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const [left, setLeft] = useState<Pokemon>(STARTING_TEAM.left);
  const [right, setRight] = useState<Pokemon>(STARTING_TEAM.right);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [log, setLog] = useState<string[]>([
    "Battle initialized. Auraflare awaits your command.",
  ]);
  const [winner, setWinner] = useState<"left" | "right" | null>(null);
  const [animation, setAnimation] = useState<AttackAnimation | null>(null);
  const timeouts = useRef<NodeJS.Timeout[]>([]);
  const leftRef = useRef(left);
  const rightRef = useRef(right);
  const animationCounter = useRef(0);
  const randomState = useRef(0x12345678);

  const nextAnimationId = () => {
    animationCounter.current += 1;
    return animationCounter.current;
  };

  const nextRandom = () => {
    randomState.current =
      (Math.imul(randomState.current, RNG_MULT) + RNG_INC) >>> 0;
    return randomState.current / RNG_MOD;
  };

  const resetBattle = () => {
    timeouts.current.forEach((id) => clearTimeout(id));
    timeouts.current = [];
    setLeft(STARTING_TEAM.left);
    setRight(STARTING_TEAM.right);
    setIsPlayerTurn(true);
    setIsAnimating(false);
    setWinner(null);
    setAnimation(null);
    setLog(["Battle reset. Auraflare awaits your next instruction."]);
    animationCounter.current = 0;
    randomState.current = (randomState.current + 0x9e3779b9) >>> 0;
  };

  useEffect(() => {
    return () => {
      timeouts.current.forEach((id) => clearTimeout(id));
    };
  }, []);

  useEffect(() => {
    leftRef.current = left;
  }, [left]);

  useEffect(() => {
    rightRef.current = right;
  }, [right]);

  const queueTimeout = (callback: () => void, delay: number) => {
    const timeout = setTimeout(() => {
      callback();
      timeouts.current = timeouts.current.filter((id) => id !== timeout);
    }, delay);

    timeouts.current.push(timeout);
  };

  const createAttackAnimation = (
    side: "left" | "right",
    move: Move,
  ): AttackAnimation => {
    const trails = Array.from({ length: 6 }, (_, index) => {
      const base = 40 + index * 6;
      const startJitter = (nextRandom() - 0.5) * 14;
      const endJitter = (nextRandom() - 0.5) * 22;
      return {
        startTop: clamp(base + startJitter, 26, 74),
        endTop: clamp(base + endJitter, 26, 74),
      };
    });

    return {
      id: nextAnimationId(),
      side,
      move,
      trails,
    };
  };

  const appendLog = (entry: string) => {
    setLog((prev) => [entry, ...prev].slice(0, 12));
  };

  const handleDamage = (attacker: Pokemon, defender: Pokemon, move: Move) => {
    if (isHealingMove(move)) {
      const healAmount = Math.round(attacker.maxHp * 0.18);
      const updated = clamp(attacker.hp + healAmount, 0, attacker.maxHp);
      appendLog(`${attacker.name} softly recovers ${healAmount} HP with ${move.name}.`);
      return { attackerHp: updated, defenderHp: defender.hp };
    }

    if (nextRandom() > move.accuracy) {
      appendLog(`${attacker.name}'s ${move.name} gently dissipates—it missed.`);
      return { attackerHp: attacker.hp, defenderHp: defender.hp };
    }

    const effectiveness = calculateEffectiveness(move, defender);
    const variance = 0.9 + nextRandom() * 0.2;
    const baseDamage = Math.round(move.power * variance * effectiveness);
    const damage = Math.max(8, baseDamage);
    const hpAfter = clamp(defender.hp - damage, 0, defender.maxHp);

    if (effectiveness > 1.5) {
      appendLog(`It's super effective! ${defender.name} absorbs intense damage.`);
    } else if (effectiveness > 0 && effectiveness < 1) {
      appendLog(`It's not very effective... ${defender.name} endures gracefully.`);
    }
    appendLog(`${attacker.name} uses ${move.name} for ${damage} damage.`);

    return { attackerHp: attacker.hp, defenderHp: hpAfter };
  };

  const concludeTurn = (nextSide: "left" | "right") => {
    queueTimeout(() => setAnimation(null), 560);
    queueTimeout(() => {
      const currentLeft = leftRef.current;
      const currentRight = rightRef.current;
      const leftFainted = currentLeft.hp <= 0;
      const rightFainted = currentRight.hp <= 0;
      if (leftFainted || rightFainted) {
        const victorious = leftFainted
          ? "right"
          : rightFainted
            ? "left"
            : nextSide === "left"
              ? "right"
              : "left";
        setWinner(victorious);
        appendLog(
          `${
            victorious === "left" ? currentLeft.name : currentRight.name
          } takes the spotlight. Battle complete.`,
        );
        setIsAnimating(false);
        return;
      }
      setIsPlayerTurn(nextSide === "left");
      setIsAnimating(false);
      if (nextSide === "right") {
        queueTimeout(() => initiateAiTurn(), 800);
      }
    }, 620);
  };

  const initiateAiTurn = () => {
    if (winner) return;
    setIsAnimating(true);
    const attacker = rightRef.current;
    const availableMoves = attacker.moves.filter(
      (move) => move.power > 0 || attacker.hp < attacker.maxHp,
    );
    const movePool = availableMoves.length > 0 ? availableMoves : attacker.moves;
    const moveIndex = Math.floor(nextRandom() * movePool.length);
    const move = movePool[Math.min(moveIndex, movePool.length - 1)];
    setAnimation(createAttackAnimation("right", move));

    queueTimeout(() => {
      setLeft((prevLeft) => {
        const { attackerHp, defenderHp } = handleDamage(attacker, prevLeft, move);
        setRight((prevRight) => ({ ...prevRight, hp: attackerHp }));
        return { ...prevLeft, hp: defenderHp };
      });
    }, 360);

    concludeTurn("left");
  };

  const handlePlayerMove = (move: Move) => {
    if (!isPlayerTurn || isAnimating || winner) return;
    setIsAnimating(true);
    setAnimation(createAttackAnimation("left", move));

    queueTimeout(() => {
      const defenderSnapshot = rightRef.current;
      setLeft((prevLeft) => {
        const { attackerHp, defenderHp } = handleDamage(prevLeft, defenderSnapshot, move);
        setRight((prevRight) => ({ ...prevRight, hp: defenderHp }));
        return { ...prevLeft, hp: attackerHp };
      });
    }, 360);

    concludeTurn("right");
  };

  const battlefieldStatus = winner
    ? `${winner === "left" ? left.name : right.name} wins the exhibition battle!`
    : isPlayerTurn
      ? "Auraflare is waiting for your move."
      : "Voltide is studying the field...";

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-5 py-12">
      <div className="absolute inset-0">
        <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-72 w-[520px] rounded-[46px] bg-white/55 blur-[120px]" />
      </div>

      <div className="glass-panel relative flex w-full max-w-6xl flex-col gap-10 rounded-[42px] border-white/50 bg-white/70 p-10 shadow-[0_40px_120px_rgba(30,64,175,0.16)]">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-[clamp(32px,5vw,48px)] font-semibold tracking-tight text-slate-900">
              Celestial Duel
            </h1>
            <p className="text-sm uppercase tracking-[0.38em] text-slate-500">
              Turn-Based Pokémon Experience
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full border border-white/50 bg-white/60 px-5 py-2 text-sm font-medium tracking-wide text-slate-800 shadow-inner shadow-white/40">
              {battlefieldStatus}
            </div>
            <button
              onClick={resetBattle}
              className="rounded-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition-transform duration-200 hover:scale-[1.02]"
            >
              Reset Battle
            </button>
          </div>
        </header>

        <section className="relative rounded-[36px] border border-white/45 bg-gradient-to-br from-white/70 to-white/35 p-8 shadow-[0_20px_100px_rgba(56,102,211,.18)]">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_auto_1fr]">
            <div className="relative">
              <PokemonPresenter
                pokemon={left}
                side="left"
                isActive={isPlayerTurn && !winner}
                statusText={winner === "left" ? "Victorious" : undefined}
              />
            </div>

            <div className="relative hidden items-center justify-center lg:flex">
              <div className="flex flex-col items-center gap-6">
                <span className="rounded-full border border-dashed border-white/55 bg-white/70 px-6 py-2 text-sm font-semibold uppercase tracking-[0.4em] text-slate-500">
                  VS
                </span>
                <div className="h-32 w-px bg-gradient-to-b from-transparent via-white/60 to-transparent" />
                <div className="rounded-3xl border border-white/60 bg-white/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Arcadia Plains
                </div>
              </div>
            </div>

            <div className="relative">
              <PokemonPresenter
                pokemon={right}
                side="right"
                isActive={!isPlayerTurn && !winner}
                statusText={winner === "right" ? "Victorious" : undefined}
              />
            </div>
          </div>

          <AttackStream animation={animation} />
        </section>

        <section className="grid gap-8 lg:grid-cols-[1.35fr_minmax(0,1fr)]">
          <div className="flex flex-col gap-5 rounded-[32px] border border-white/45 bg-white/65 p-6 shadow-[0_20px_50px_rgba(30,64,175,0.12)]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                Command Console
              </h2>
              <span className="text-xs uppercase tracking-[0.4em] text-slate-500">
                Select a move
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {left.moves.map((move) => {
                const color = MOVE_COLOR[move.type];
                const disabled =
                  !isPlayerTurn || isAnimating || winner !== null || (isHealingMove(move) && left.hp === left.maxHp);

                return (
                  <button
                    key={move.name}
                    onClick={() => handlePlayerMove(move)}
                    disabled={disabled}
                    className={`group flex flex-col items-start gap-3 rounded-3xl border border-white/50 bg-gradient-to-br ${color} px-5 py-4 text-left shadow-[0_20px_50px_rgba(30,64,175,0.18)] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-800">
                        {move.type}
                      </span>
                      <span className="text-lg">{getMoveIconSet(move.type)[0]}</span>
                    </div>
                    <div>
                      <p className="text-xl font-semibold text-slate-900">
                        {move.name}
                      </p>
                      <p className="text-sm text-slate-700/80">{move.description}</p>
                    </div>
                    <div className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-[0.4em] text-slate-700/90">
                      <span>Power {move.power === 0 ? "—" : move.power}</span>
                      <span>Accuracy {Math.round(move.accuracy * 100)}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/50">
                      <div
                        className="h-full rounded-full bg-white/80 transition-transform duration-300 group-hover:scale-x-105 origin-left"
                        style={{ width: `${Math.max(move.power, 40)}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-[32px] border border-white/45 bg-white/65 p-6 shadow-[0_18px_46px_rgba(56,102,211,.16)]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                Battle Log
              </h2>
              <span className="text-xs uppercase tracking-[0.4em] text-slate-500">
                Latest Events
              </span>
            </div>
            <div className="flex max-h-[260px] flex-col gap-3 overflow-hidden">
              {log.map((entry, index) => (
                <div
                  key={`${entry}-${index}`}
                  className="rounded-2xl border border-white/50 bg-white/70 px-4 py-3 text-sm text-slate-700 shadow-inner shadow-white/40"
                >
                  {entry}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
