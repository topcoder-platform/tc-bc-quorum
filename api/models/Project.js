// (project.projectId, project.clientId, project.copilotId, project.name, project.description, project.budget, status, createdBy, updatedBy)
const columns = [
  {name: 'projectId'},
  {name: 'clientId'},
  {name: 'copilotId'},
  {name: 'name'},
  {name: 'description'},
  {name: 'budget', type: Number, private: true},
  {name: 'status'},
  {name: 'createdBy'},
  {name: 'updatedBy'},
];

const groups = {
  Part1: ['projectId', 'clientId', 'copilotId', 'name', 'description'],
  Part2: ['budget', 'status', 'createdBy', 'updatedBy']
};

module.exports = {
  columns,
  groups,
  id: 'projectId'
};