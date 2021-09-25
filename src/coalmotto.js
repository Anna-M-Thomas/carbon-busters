const coalMottos = [
  "Feel guilty about your hot showers while we burn the planet down!",
  "Why use smart, sustainable sources of energy when you can use the dumb harmful ones?",
  "Japan is soooo modern and progressive *belches smoke*",
  "Destroying your childrens' future: one day at a time!",
  "This is a volcanic island country with its share of sun and wind and surrounded by ocean...no energy sources here! Better import coal",
  "Power your homes with the tears of your children!™️",
  "Humanity shoots itself in the foot and we're pulling the trigger!",
  "Suuuure, we're phasing out coal! Right after we build this new coal plant",
  "Thanks to us, Japan will have four seasons: hot, also hot, hotter, and hottest!",
  "Importing the living daylights out of foreign coal instead of using our own energy sources",
  "World's 5th bigggest carbon emitter, baybee! Suck it, earth!",
];

const politicianMottos = [
  "Protect our childrens' future, pah! I hatched fully formed from an egg",
  "I don't care about the world! As long as I'm rich and get to give boring speeches!",
  "Do you like my SDGs pin? SDGs!!! The goals are 'something something eat the poor burn down the rainforests,' right?",
  "My wife was saying something about that environment thingy. At least, I think it was my wife. One of those women who does my dishes.",
  "I am 10,000 years old and still in power!",
  "My luxury bunker's all set up for my descendants!",
  "Oh hi, honey, get me a cup of coffee, will you? That's a girl.",
  "I run off of shochu, coffee, cigarettes and contempt for the weak!",
  "Can nature give me money and those weird-ass state fair ribbons that show I'm special? I think not!",
  "Global warming, pah! I have much more pressing matters to attend: waving at people with white gloves on!",
  "Protect the future for our 'kids?' Kids are those small creatures living in my wife's house, right?",
];

const getMotto = (type) => {
  let randomIndex;
  if (type === "coal") {
    randomIndex = Math.floor(Math.random() * coalMottos.length);
    return coalMottos[randomIndex];
  } else if ((type = "politician")) {
    randomIndex = Math.floor(Math.random() * politicianMottos.length);
    return politicianMottos[randomIndex];
  }
};

export default getMotto;
