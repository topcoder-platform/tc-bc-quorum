module.exports = {
  networks: {
    development: {
      from: '0x9186eb3d20cbd1f5f992a950d808c4495153abd5',
      privateFor: ['BULeR8JyUWhiuuCMU/HLA0Q5pzkYT+cHII3ZKBey3Bo='],
      host: 'localhost',
      port: 22000,
      network_id: '*', // Match any network id
      gasPrice: 0, // Same value as `truffle develop`,
      gas: 0x47b760
    }
  }
};
