module.exports = {
  PAGE_ACCESS_TOKEN: process.env.PAGE_ACCESS_TOKEN
    ? process.env.PAGE_ACCESS_TOKEN
    : 'EAACrt0LSQ20BAPsPLD8vnYh3ZAx0qt2nlZAGtENVNCvolOvQX2o4lIZAyP4sS2j74W5ZCaYaFi5Nrvs5pAIngg2mr2tUHnaHqrg79uL3pl3j2dO34CBISvkHijRrHfnzsBPXHLrauQqPeOQNt6ReqeCMc0k70iZBlZCbV6T5zP9wZDZD',
  secret: process.env.NODE_ENV === 'production' ? process.env.SECRET : 'secret'
};
