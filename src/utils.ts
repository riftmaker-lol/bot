import Logger from './logger';
import { Tournament } from './types';

const logger = new Logger({ name: 'Utils' });

export const getTournamentData = async (tournamentId: string) => {
  try {
    const response = await fetch(`https://riftmaker.lol/api/tournament/${tournamentId}`);
    const data = (await response.json()) as Tournament;
    return data;
  } catch (error) {
    logger.error(error);
  }
};
