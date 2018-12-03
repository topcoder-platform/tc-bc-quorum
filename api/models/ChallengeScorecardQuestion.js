let columns = [
  {name: 'text'},
  {name: 'weight', type: Number},
  {name: 'order', type: Number},
];
const toJSON = (obj) => {
  obj.weight = obj.weight / 100.0;
  return obj;
};

const flatten = (obj, current) => {
  // convert the weight to int
  current[1] = parseInt(obj.weight * 100 + 0.5);
  return current;
};

module.exports = {
  id: 'text',
  columns,
  toJSON,
  flatten
};