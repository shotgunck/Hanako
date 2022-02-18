let db

module.exports = {
  msgSplit(msg) {
    return [
      msg.substring(0, 1999),
      msg.substring(2000, 3999)
    ]
  },

  bondapp: {
    youtube: '880218394199220334',
    poker: '755827207812677713',
    betrayal: '773336526917861400',
    fishing: '814288819477020702',
    chess: '832012774040141894',
    lettertile: '879863686565621790',
    wordsnack: '879863976006127627',
    doodlecrew: '878067389634314250',
    awkword: '879863881349087252',
    spellcast: '852509694341283871',
    checkers: '832013003968348200',
    puttparty: '763133495793942528',
    sketchyartist: '879864070101172255'
  },

  setdb(database) {
    db = database
  },

  getdb() {
    return db
  },

  async prefix(guildId) {
    return await db.get(guildId, 'prefix')
  }
}