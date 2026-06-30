export type AbilityType =
  | 'none'
  | 'double_shot'
  | 'swap'
  | 'double_turn'
  | 'ghost'
  | 'knockback'
  | 'cond_revive'
  | 'snipe'
  | 'lockdown'
  | 'push_two'
  | 'revive_once'
  | 'summon_star'
  | 'cond_swap'
  | 'align'
  | 'double_power'
  | 'cond_disguise'
  | 'piercing'
  | 'push_all'
  | 'pull'
  | 'cond_reverse'
  | 'push_outward'
  | 'cond_couple';

export type AbilityKind = 'attack' | 'defense';

export interface Ability {
  type: AbilityType;
  kind: AbilityKind;
  nameKo: string;
  descKo: string;
  maxUses?: number;
}

export interface CardDef {
  id: string;
  name: string;
  sign: string;
  mana: number;
  atk: number;
  hp: number;
  attackAbility: Ability;
  defenseAbility: Ability;
  image: string;
}

export type StatusEffect =
  | 'ghost'
  | 'lockdown'
  | 'double_power'
  | 'cond_disguise'
  | 'cond_reverse'
  | 'summoning_sickness';

export interface Minion {
  instanceId: string;
  cardId: string;
  name: string;
  sign: string;
  atk: number;
  hp: number;
  maxHp: number;
  image: string;
  position: number;
  attackAbility: Ability;
  defenseAbility: Ability;
  attackAbilityUsesLeft: number;
  defenseAbilityUsesLeft: number;
  hasAttackedThisTurn: boolean;
  attacksLeftThisTurn: number;
  statusEffects: StatusEffect[];
  disguisedAs: string | null;
  revivesLeft: number;
}

export interface Hero {
  id: 'player' | 'ai';
  hp: number;
  maxHp: number;
}

export type GamePhase =
  | 'menu'
  | 'playing'
  | 'selecting_target'
  | 'selecting_swap'
  | 'selecting_snipe'
  | 'selecting_push_two'
  | 'selecting_summon'
  | 'game_over';

export type ActivePlayer = 'player' | 'ai';

export interface PendingAction {
  type: AbilityType;
  sourceId: string;
  targetsSelected: string[];
  targetsNeeded: number;
}

export interface GameState {
  phase: GamePhase;
  activePlayer: ActivePlayer;
  turn: number;
  playerHero: Hero;
  aiHero: Hero;
  playerField: (Minion | null)[];
  aiField: (Minion | null)[];
  playerHand: CardDef[];
  aiHand: CardDef[];
  playerDeck: CardDef[];
  aiDeck: CardDef[];
  playerMana: number;
  playerMaxMana: number;
  aiMana: number;
  aiMaxMana: number;
  extraTurn: boolean;
  pendingAction: PendingAction | null;
  selectedMinionId: string | null;
  log: string[];
  winner: ActivePlayer | null;
}
