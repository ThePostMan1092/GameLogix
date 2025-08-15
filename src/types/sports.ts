export interface SportParent {
  name: 'Ping Pong' | 'Basketball' | 'Bowling' | 'Spikeball' | 'Ten' | 'Custom' | 'Pickleball';
  playerFormat: 'solo' | 'duel' | 'smallTeam' | 'mediumTeam' | 'largeTeam' | 'freeForAllSmall' | 'freeForAllLarge' | 
  'relayTeam' | 'multiPair' | 'groupIndividual';
  scoringFormat: 'totalFewRounds' | 'totalManyRounds' | 'roundWins' | 'timeBest' | 'timeLongest' | 'timeAverage' |
  'accuracyScore' | 'distanceLongest' | 'distanceShortest' | 'elimination' | 'simpleScore';
}

export const scoringTypes = [
  {type: 'solo competition round based', sports: ['Bowling', 'Golf', 'poker' ]},
  {type: 'small team round based', sports: ['Ping Pong', 'Pickleball', 'tennis', 'badminton', 'volleyball']},
  {type: 'team splitup game', sports: ['Basketball', 'Soccer', 'Rugby', 'Football', 'Hockey']},
  {type: 'small size turn based', sports: ['spades', 'chess', 'horseshoes', ]},
  {type: 'team splitup round based', sports: ['darts', 'cornhole', 'pool', 'bowling']},
  {type: 'solo', sports: ['running', 'swimming', 'cycling', 'triathlon', 'speedcubing', 'speedruns']},
]

export interface CustomStat {
  name: string;
  dataType: 'number' | 'time' | 'boolean' | 'text' | 'counter';
  description?: string | null;
  minValue?: number | null;
  maxValue?: number | null;
  defaultValue?: string | number | boolean | null;
  decimalPlaces?: number;
  affectsScore: boolean;
  pointValue?: number;
}

export interface SpecialRule {
  name: string;
  description: string;
}

export interface Sport {
  id: string;
  sportParent: SportParent; // restrict to allowed categories
  name: string;
  description?: string;
  gameType: 'solo' | 'competition';
  teamFormat: 'individuals' | 'teams';
  playerLayout?: 'smallTeam' | 'largeTeam' | 'solo' | 'manyIndividuals';
  recordLayout?: 'table' | 'cards';
  numberOfTeams?: number;
  playersPerTeam?: number;
  trackByPlayer: boolean;
  useRounds: boolean;
  roundsName?: string;
  maxRounds?: number;
  trackPerRound?: boolean;
  winCondition: 'First to point limit' | 'First to round limit' | 'Most points';
  winPoints?: number;
  winRounds?: number;
  cannotTie: boolean;
  winBy?: number; 
  playStyle?: 'turn-based' | 'simultaneous';
  activeTrack: boolean;
  customStats?: CustomStat[]; // New structured stats
  customSpecialRules?: SpecialRule[]; // New structured special rules
  tiebreakerStats?: { statName: string; tiebreakerValue: number }[]; // Tiebreaker configuration for when ties are not allowed
  createdAt: Date;
  createdBy: string; // user ID
  adjustable: boolean;
}

const basketballFullTeam: Sport = {
  id: 'uuid-or-sport-name',
  name: 'Basketball',
  gameType: 'competition',
  playerLayout: 'largeTeam',
  recordLayout: 'cards',
  teamFormat: 'teams',
  numberOfTeams: 2,
  playersPerTeam: 5,
  useRounds: true,
  roundsName: 'quarters',
  maxRounds: 4,
  winCondition: 'Most points',
  cannotTie: true,
  playStyle: 'simultaneous',
  trackByPlayer: false,
  activeTrack: false,
  customStats: [
    {
      name: 'Two-Pointers',
      dataType: 'counter',
      minValue: 0,
      affectsScore: true,
      pointValue: 2
    },
    {
      name: 'Three-Pointers',
      dataType: 'counter',
      minValue: 0,
      affectsScore: true,
      pointValue: 3
    },
    {
      name: 'Fouls',
      dataType: 'counter',
      description: 'Team fouls committed',
      defaultValue: 0,
      affectsScore: false
    },

  ],
  customSpecialRules: [
    {
      name: 'Shot Clock',
      description: '24 seconds to attempt a shot'
    },
    {
      name: 'Three Point Line',
      description: 'Shots beyond the arc count for 3 points'
    }
  ],
  tiebreakerStats: [
    {
      statName: 'Fouls',
      tiebreakerValue: -0.01 // Fewer fouls win ties
    }
  ],
  createdAt: new Date(),
  createdBy: 'user123',
  adjustable: true,
  sportParent: {name: 'Basketball', playerFormat: 'largeTeam', scoringFormat: 'totalManyRounds'}
}

const pingPongDoubles: Sport = {
  id: 'uuid-or-sport-name',
  name: 'Ping Pong Doubles',
  gameType: 'competition',
  teamFormat: 'teams',
  playerLayout: 'smallTeam',
  recordLayout: 'cards',
  numberOfTeams: 2,
  playersPerTeam: 2,
  useRounds: true,
  roundsName: 'sets',
  trackPerRound: true,
  winCondition: 'First to round limit',
  winPoints: 21,
  winRounds: 2,
  cannotTie: false,
  winBy: 2,
  playStyle: 'simultaneous',
  trackByPlayer: false,
  activeTrack: false,
  customStats: [
    {
      name: 'Points',
      dataType: 'number',
      description: 'Points scored in the set',
      minValue: 0,
      maxValue: 21,
      defaultValue: 0,
      decimalPlaces: 0,
      affectsScore: true
    },
    {
      name: 'Aces',
      dataType: 'number',
      description: 'Unreturnable serves',
      defaultValue: 0,
      affectsScore: false
    }
  ],
  customSpecialRules: [
    {
      name: '6in Server',
      description: 'Must throw the ball up 6 inches on the serve before hitting it'
    },
    {
      name: 'Let Serve',
      description: 'If ball hits net and lands in service area, replay the serve'
    }
  ],
  createdAt: new Date(),
  createdBy: 'user123',
  adjustable: true,
  sportParent: {name: 'Ping Pong', playerFormat: 'smallTeam', scoringFormat: 'totalManyRounds'}
}

const bowlingSolo: Sport = {
  id: 'uuid-or-sport-name',
  name: 'Bowling Singles',
  gameType: 'solo',
  teamFormat: 'individuals',
  playerLayout: 'manyIndividuals',
  recordLayout: 'table',
  useRounds: true,
  roundsName: 'frames',
  maxRounds: 10,
  winCondition: 'Most points',
  cannotTie: false,
  playStyle: 'turn-based',
  trackByPlayer: true,
  activeTrack: false,
  customStats: [
    {
      name: 'Score',
      dataType: 'number',
      description: 'Total bowling score',
      minValue: 0,
      maxValue: 300,
      defaultValue: 0,
      decimalPlaces: 0,
      affectsScore: true
    },
    {
      name: 'Strikes',
      dataType: 'counter',
      description: 'Number of strikes bowled',
      defaultValue: 0,
      affectsScore: false
    },
    {
      name: 'Spares',
      dataType: 'counter',
      description: 'Number of spares bowled',
      defaultValue: 0,
      affectsScore: false
    }
  ],
  customSpecialRules: [
    {
      name: 'Strike',
      description: 'Knock down all 10 pins on first roll - score 10 plus next 2 rolls'
    },
    {
      name: 'Spare',
      description: 'Knock down all 10 pins in two rolls - score 10 plus next 1 roll'
    },
    {
      name: 'Gutter Ball',
      description: 'Ball goes in gutter - counts as 0 pins knocked down'
    }
  ],
  createdAt: new Date(),
  createdBy: 'user123',
  adjustable: true,
  sportParent: {name: 'Bowling', playerFormat: 'freeForAllSmall', scoringFormat: 'totalManyRounds'}
}

const pickleballDoubles: Sport = {
  id: 'uuid-or-sport-name',
  name: 'Pickleball Doubles',
  gameType: 'competition',
  teamFormat: 'teams',
  playerLayout: 'smallTeam',
  recordLayout: 'cards',
  useRounds: true,
  roundsName: 'Sets',
  maxRounds: 3,
  winCondition: 'First to round limit',
  cannotTie: false,
  winBy: 2,
  playStyle: 'turn-based',
  trackByPlayer: false,
  activeTrack: false,
  customStats: [
    {
      name: 'Score',
      dataType: 'number',
      description: '',
      minValue: 0,
      maxValue: 21,
      defaultValue: 0,
      decimalPlaces: 0,
      affectsScore: true
    },
    {
      name: 'Aces',
      dataType: 'counter',
      description: 'Number of aces served',
      defaultValue: 0,
      decimalPlaces: 0,
      affectsScore: false
    }
  ],
  customSpecialRules: [
  ],
  createdAt: new Date(),
  createdBy: 'user123',
  adjustable: true,
  sportParent: {name: 'Pickleball', playerFormat: 'freeForAllSmall', scoringFormat: 'totalManyRounds'}
}

const tenGame: Sport = {
  id: 'ten-game-uuid',
  name: 'Ten',
  gameType: 'competition',
  teamFormat: 'individuals',
  playerLayout: 'manyIndividuals',
  recordLayout: 'cards',
  numberOfTeams: 4,
  playersPerTeam: 1,
  useRounds: false,
  winCondition: 'First to point limit',
  winPoints: 10,
  cannotTie: true,
  playStyle: 'turn-based',
  trackByPlayer: true,
  activeTrack: false,
  customStats: [
    {
      name: 'Points',
      dataType: 'number',
      description: 'Main game points',
      minValue: 0,
      maxValue: 10,
      defaultValue: 0,
      decimalPlaces: 0,
      affectsScore: true,
      pointValue: 1
    },
    {
      name: 'Extra Cards',
      dataType: 'counter',
      description: 'Additional cards taken',
      defaultValue: 0,
      affectsScore: false
    },
    {
      name: 'Extra Points',
      dataType: 'counter',
      description: 'Bonus points earned',
      defaultValue: 0,
      affectsScore: false
    }
  ],
  customSpecialRules: [
    {
      name: 'Tiebreaker Rules',
      description: 'If points tie, player with fewer extra cards wins. If that ties, player with most extra points wins.'
    }
  ],
  tiebreakerStats: [
    {
      statName: 'Extra Cards',
      tiebreakerValue: -0.01 // Fewer extra cards win ties (first tiebreaker)
    },
    {
      statName: 'Extra Points',
      tiebreakerValue: 0.001 // More extra points win ties (second tiebreaker)
    }
  ],
  createdAt: new Date(),
  createdBy: 'user123',
  adjustable: true,
  sportParent: {name: 'Ten', playerFormat: 'freeForAllSmall', scoringFormat: 'simpleScore'}
}



const sports: Sport[] = [basketballFullTeam, pingPongDoubles, bowlingSolo, pickleballDoubles, tenGame];

export default sports;