export interface Tournament {
  id: string;
  name: string;
  status: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  participants: Participant[];
  kickedPlayers: Participant[];
  teams: Team[];
}

export interface Participant {
  id: string;
  riotId: string;
  name: string;
  role: string;
  elo: string;
  image: string;
  tournamentId: string;
  kicked: boolean;
}

export interface Team {
  id: string;
  name: string;
  tournamentId: string;
  players: Player[];
}

export interface Player {
  id: string;
  riotId: string;
  name: string;
  role: string;
  elo: string;
  image: string;
  mainRole: string;
}
