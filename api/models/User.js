// (user.memberId, user.memberEmail, user.role, user.memberAddress);
const columns = [
  {name: 'memberId'},
  {name: 'memberEmail'},
  {name: 'role'},
  {name: 'memberAddress'}
];

module.exports = {
  columns,
  id: 'memberId'
};