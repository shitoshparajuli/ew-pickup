import Link from 'next/link';
import { Game } from '@/data/types';
import { getAllGames } from '@/lib/games';

export default async function GamesPage() {
  // Fetch games using our utility function
  const games = await getAllGames();
  const upcomingGames = games.filter(game => game.status === 'upcoming');
  const pastGames = games.filter(game => game.status === 'completed');

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Soccer Pickup Games</h1>
        
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Upcoming Games</h2>
          <div className="space-y-4">
            {upcomingGames.map(game => (
              <div key={game.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold">{game.date} at {game.time}</h3>
                    <p className="text-gray-600">{game.location}</p>
                    <p className="mt-2">
                      Players: <span className="font-medium">{game.playersCount}</span>
                    </p>
                  </div>
                  <Link href={`/games/${game.id}`}>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded">
                      View Details
                    </button>
                  </Link>
                </div>
              </div>
            ))}
            {upcomingGames.length === 0 && (
              <p className="text-gray-500 text-center py-4">No upcoming games scheduled</p>
            )}
          </div>
        </section>
        
        <section>
          <h2 className="text-2xl font-bold mb-4">Past Games</h2>
          <div className="space-y-4">
            {pastGames.map(game => (
              <div key={game.id} className="bg-white rounded-lg shadow-md p-6 opacity-80">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold">{game.date} at {game.time}</h3>
                    <p className="text-gray-600">{game.location}</p>
                    <p className="mt-2">
                      Players: <span className="font-medium">{game.playersCount}</span>
                    </p>
                  </div>
                  <Link href={`/games/${game.id}`}>
                    <button className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded">
                      View Summary
                    </button>
                  </Link>
                </div>
              </div>
            ))}
            {pastGames.length === 0 && (
              <p className="text-gray-500 text-center py-4">No past games</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
