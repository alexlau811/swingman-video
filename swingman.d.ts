interface LeagueTeam {
  name: string
}

interface Team {
  team: LeagueTeam
}

interface Match {
  id: number,
  home?: Team,
  away?: Team,
  booking: {
    date: Date,
    time: string
  }
}
