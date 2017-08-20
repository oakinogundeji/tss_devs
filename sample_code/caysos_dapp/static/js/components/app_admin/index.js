'use strict';
//=============================================================================
/**
 * module
 */
//=============================================================================
module.exports = function (jQ, web3, Promise) {
  return {
      template: require('./template.html'),
      data: function () {
        return {
          initialSupply: '',
          initialSupplyInput: '',
          restrictionPeriod: '',
          restrictionPeriodInput: '',
          spinner: false,
          fileURL: '/getContractFile',
          persistContractAddressURL: '/saveContractAddress',
          deleteContractAddressURL: '/deleteContractAddress',
          byteCode: '',
          abiDef: '',
          caysoContractAddress: '',
          caysoContractTXHash: '',
          showNodeConnected: false,
          showWeb3NodeInfo: false,
          web3NodeInfo: '',
          caysoTestnetCoinbase: '',
          acctPWD: '',
          showCoinbase: false,
          ethereumNWInfo: '',
          coinbaseBalance: '',
          minerBalance: '',
          instantiatedContract: null,
          caysoNWBalance: '',
          caysoNWMembersSum: '',
          deployingContract: false,
          showCaysoAcctUnlocked: false,
          getAcctPWD: false,
          showPWDErr: false,
          caysoTestnetMinerVM: '0x83da0d681a82D278293Cc429bDB3465a7B5Bb09f',
          deployContractErrMsg: '',
          showDeployContractErrMsg: false
        };
      },
      props: ['contractAddress'],
      computed: {
        existingContract: function () {
          console.log(`admin contract already Exists: ${this.contractAddress}`);
          if(this.contractAddress || this.caysoContractAddress) {
            return true;
          } else {
            return false;
          }
        }
      },
      methods: {
        initiateDeployContract: function () {
          console.log('initiateDeployContract btn clicked');
          return jQ('#deployContractModalBtn').trigger('click');
        },
        confirmContractParams: function () {
          if(this.initialSupplyInput && this.restrictionPeriodInput) {
            this.spinner = true;
            console.log(`initialSupply: ${this.initialSupply}, restrictionPeriod: ${this.restrictionPeriod}`);
            this.initialSupply = Number(this.initialSupplyInput);
            this.restrictionPeriod = Number(this.restrictionPeriodInput);
            this.initialSupplyInput = this.restrictionPeriodInput = '';
            return this.getCompiledContract();
          } else {
            return null;
          }
        },
        getCompiledContract: function () {
          console.log('getCompiledContract called...');
          return this.$http.get(this.fileURL)
            .then(data => {
              this.spinner = false;
              console.log('contract file data from server');
              jQ('#closeDeployContractModal').trigger('click');
              this.deployingContract = true;
              console.log(data);
              this.byteCode = '0x' + data.body.code;
              this.abiDef = JSON.parse(data.body.abi);
              console.log(this.byteCode);
              console.log(this.abiDef);
              return this.createContractObject();
            })
            .catch(err => {
              this.spinner = false;
              console.error('contract file read err...');
              console.error(err);
              jQ('#closeDeployContractModal').trigger('click');
              return false;
            });
        },
        createContractObject: function () {
          console.log('createContractObject called...');
          const
            contract = web3.eth.contract(this.abiDef),
            params = {
                from: this.caysoTestnetCoinbase,
                data: this.byteCode,
                gas: 3000000
            },
            constructor_param = this.initialSupply;
          console.log('contract obj...');
          console.log(contract);
          return contract.new(constructor_param, params, (err,resp) => {
              if(err){
                  console.error(err);
                  this.deployingContract = false;
                  let $errMsg = jQ('#deploy-contract-err');
                  this.showDeployContractErrMsg = true;
                  this.deployContractErrMsg = err;
                  return $errMsg.fadeIn(200).fadeOut(4500);
              } else {
                  console.log('resp:');
                  console.log(resp);
                  if(resp.address){
                    console.log('deployed contract address...');
                    console.log(resp.address);
                    this.deployingContract = false;
                    this.caysoContractAddress = resp.address;
                    return this.getDeployedContractInstance(contract);
                  } else {
                    console.log('caysoContractTXHash');
                    console.log(resp.transactionHash);
                    this.caysoContractTXHash = resp.transactionHash;
                  }
              }
          });
        },
        getDeployedContractInstance: function (contract) {
          console.log('getDeployedContractInstance called...');
          if(this.contractAddress.trim()) {
            this.instantiatedContract = contract.at(this.contractAddress)
          } else {
            this.instantiatedContract =  contract.at(this.caysoContractAddress);
          }
          console.log(this.instantiatedContract);
          console.log('typeof(this.instantiatedContract):', typeof(this.instantiatedContract));
          return this.persistContract();
        },
        persistContract: function () {
          console.log('persistContract invoked...');
          if(this.caysoContractAddress.trim()) {
            return this.$http.post(this.persistContractAddressURL, {
              address: this.caysoContractAddress.trim()
            })
              .then(ok => console.log(ok.body))
              .catch(err => console.log(err));
          } else {
            return null;
          }
        },
        viewFunds: function () {

          console.log('view funds triggered...');

          const vm = this;

          function getMinerVMBalance() {
            return new Promise((resolve, reject) => {
              return web3.eth.getBalance(vm.caysoTestnetMinerVM, (err, res) => {
                if(err) {
                  console.error('coinBase balance retrieval err');
                  console.error(err);
                  return reject();
                } else {
                  console.log('coinBase balance retrieval success');
                  console.log('balance in Wei...');
                  console.log(res.toNumber());
                  console.log('balance in ethers...');
                  console.log(web3.fromWei(res.toNumber()));
                  vm.minerBalance = 'Miner: ' + web3.fromWei(res.toNumber());
                  return resolve(vm.minerBalance);
                }
              });
            });
          }

          function getCoinbaseBalance() {
            return new Promise((resolve, reject) => {
              return web3.eth.getBalance(vm.caysoTestnetCoinbase, (err, res) => {
                if(err) {
                  console.error('coinBase balance retrieval err');
                  console.error(err);
                  return reject(err);
                } else {
                  console.log('coinBase balance retrieval success');
                  console.log('balance in Wei...');
                  console.log(res.toNumber());
                  console.log('balance in ethers...');
                  console.log(web3.fromWei(res.toNumber()));
                  vm.coinbaseBalance = 'Cayso Coinbase: ' + web3.fromWei(res.toNumber());
                  return resolve(vm.coinbaseBalance);
                }
              });
            });
          }

          let promiseArray = [];

          promiseArray.push(getMinerVMBalance());
          promiseArray.push(getCoinbaseBalance());

          return Promise.all(promiseArray)
            .then(ok => jQ('#coinbase-balance').fadeIn(500).fadeOut(8500))
            .catch(err => console.log('failed to get balances'));
        },
        getGlobalCaysosBalance: function () {
          if(!this.caysoContractAddress.trim()) {
            return null;
          } else {
            const contractInstance = this.instantiatedContract;
            this.caysoNWBalance = Number(contractInstance.getBalance.call());
            return jQ('#cayso-balance').fadeIn(500).fadeOut(8500);;
          }
        },
        getTotalUsers: function () {
          if(!this.caysoContractAddress.trim()) {
            return null;
          } else {
            const contractInstance = this.instantiatedContract;
            this.caysoNWMembersSum = Number(contractInstance.getTotalMembers.call());
            return jQ('#total-users').fadeIn(500).fadeOut(8500);;
          }
        },
        showPWDInput: function() {
          return this.getAcctPWD = true;
        },
        submitPWD: function () {
          if(this.acctPWD == 'P3rc@y50') {
            this.getAcctPWD = false;
            return this.unlockCaysoAcct();
          } else {
            let $errMsg = jQ('#pwd-err');
            this.showPWDErr = true;
            $errMsg.fadeIn(200).fadeOut(4500);
          }
        },
        unlockCaysoAcct: function () {
          const status = web3.personal.unlockAccount(this.caysoTestnetCoinbase, this.acctPWD, 15000);
          console.log('stats:', status);
          this.acctPWD = '';
          if(status) {
            return this.showCaysoAcctUnlocked = true;
          }
        },
        killExistingContract: function () {
          console.log('killExistingContract called...');
          if(!this.contractAddress.trim() || !this.caysoContractAddress.trim()) {
            return null;
          } else {
            const
              txObj = {
                from: this.caysoTestnetCoinbase,
                gas: 3000000
              },
              contractInstance = this.instantiatedContract;
            return contractInstance.seppuku.sendTransaction(txObj, (err, resp) => {
              if(err) {
                console.error('sepuku execution err...');
                console.error(err);
                return false;
              } else {
                console.log('sepuku execution success');
                console.log(resp);
                return this.deleteContractAddress();
              }
            });
          }
        },
        deleteContractAddress: function () {
          const vm = this;
          console.log(`cayso addr: ${this.caysoContractAddress.trim()}`);
          return this.$http.post(this.deleteContractAddressURL, {
            address: this.caysoContractAddress.trim()
          })
            .then(resp => this.caysoContractAddress = '')
            .catch(err => {
              return console.error(err);
            });
        },
        getNodeConnection: function () {
          return new Promise((resolve, reject) => {
            return web3.version.getNode((err, res) => {
              if(err) {
                console.error('node info retrieval err');
                console.error(err);
                return reject(err);
              } else {
                console.log('node info retrieval success');
                console.log(res);
                return resolve(res);
              }
            });
          });
        },
        getEthereumNetwork: function () {
          return new Promise((resolve, reject) => {
            return web3.version.getNetwork((err, res) => {
              if(err) {
                console.error('NW info retrieval err');
                console.error(err);
                return reject(err);
              } else {
                console.log('NW info retrieval success');
                console.log(res);
                return resolve(res);
              }
            });
          });
        },
        checkWeb3Connection: function () {
          return new Promise((resolve, reject) => {
            const isConnected = web3.isConnected();
            if(isConnected) {
              console.log('web3 is connected to node');
              return resolve(isConnected);
            } else {
              console.log('web3 is not connected');
              return reject(isConnected);
            }
          });
        }
      },
      mounted: function () {
        console.log('web3 from admin component');
        console.log(web3);
        console.log('accts list...');
        const nodeAccts = web3.eth.accounts;
        console.log(nodeAccts);
        this.caysoTestnetCoinbase = nodeAccts[0];
        // confirm web3 connection to node
        this.checkWeb3Connection()
          .then(ok => {
            console.log('web3 connection ok');
            this.showNodeConnected = true;
            return this.getNodeConnection();// retreiev the ethereum client being used;
          })
          .then(nodeInfo => {
            console.log(`web3 is connected to... ${nodeInfo}`);
            this.web3NodeInfo = nodeInfo;
            this.showWeb3NodeInfo = true;
            web3.eth.defaultAccount = this.caysoTestnetCoinbase;// set the coinBase as the default account
            this.showCoinbase = true;
            return this.getEthereumNetwork();
          })
          .then(info => {
            return this.ethereumNWInfo = info;
          })
          .catch(err => {
            console.error('web3 connection error')
            return console.error(err);
          });
      }
  };
};
//=============================================================================
