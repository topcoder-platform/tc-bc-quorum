let columns = [
  {name: 'reviewerId'},
  {name: 'memberId'},
  {name: 'question', type: Number},
  {name: 'text'},
  {name: 'finalScore', type: Number}
];

const toJSON = (obj) => {
  obj.appealResponse = {
    text: obj.text,
    question: obj.question,
    finalScore: obj.finalScore
  };
  delete obj.text;
  delete obj.question;
  delete obj.finalScore;
  return obj;
};

const flatten = (obj, current) => {
  current[2] = obj.appealResponse.question;
  current[3] = obj.appealResponse.text;
  current[4] = obj.appealResponse.finalScore;
};

module.exports = {
  id: 'reviewerId',
  columns,
  toJSON,
  flatten
};