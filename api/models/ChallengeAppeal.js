let columns = [
  {name: 'reviewerId'},
  {name: 'memberId'},
  {name: 'question', type: Number},
  {name: 'text'},
];

const toJSON = (obj) => {
  obj.appeal = {
    text: obj.text,
    question: obj.question
  };
  delete obj.text;
  delete obj.question;
  return obj;
};

const flatten = (obj, current) => {
  current[2] = obj.appeal.question;
  current[3] = obj.appeal.text;
};

module.exports = {
  id: 'reviewerId',
  columns,
  toJSON,
  flatten
};