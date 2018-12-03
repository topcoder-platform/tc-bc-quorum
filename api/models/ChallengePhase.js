let columns = [
  {name: 'name'},
  {name: 'startDate', type: Number},
  {name: 'endDate', type: Number}
];
const toJSON = (obj) => {
  obj.startDate = new Date(obj.startDate);
  obj.endDate = new Date(obj.endDate);
  return obj;
};

const flatten = (obj, current) => {
  current[1] = new Date(obj.startDate).getTime();
  current[2] = new Date(obj.endDate).getTime();
  return current;
};
module.exports = {
  id: 'name',
  columns,
  toJSON,
  flatten
};