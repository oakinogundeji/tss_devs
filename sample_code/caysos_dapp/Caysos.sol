pragma solidity ^0.4.4;
//=============================================================================
//=============================================================================
/**
 * dependencies
 */
//=============================================================================
//=============================================================================
/**
 * contract
 */
//=============================================================================
contract Cayso {
  //===========================================================================
  /**
   * state variables
   */
  //===========================================================================
  address public owner;
  uint public balance;
  uint memberCount;
  mapping (bytes32 => uint256) public balances;
  mapping (bytes32 => uint) memberList;
  //===========================================================================
  /**
   * events
   */
  //===========================================================================
  event NewMember(bytes32 indexed member, uint indexed initBalance);
  event DuplicateMember(bytes32 indexed duplicateMember);
  event NonExistentMember(bytes32 indexed nonExistentMember);
  event SentFunds(bytes32 indexed recipient, uint indexed amount, uint indexed globalBalance);
  event SentMemberFunds(bytes32 indexed recipient, uint indexed amount, uint indexed memberBalance);
  event InsufficientFunds(uint indexed amountToSend, uint indexed globalBalance);
  event ReceivedFunds(uint indexed origBalance, uint indexed newBalance);
  event StartedNetwork(bool indexed flag);
  event RemovedMember(bytes32 removedMember);
  event InsufficientMemberFunds(bytes32 indexed member, uint indexed amountToSend, uint indexed memberBalance);
  event RedeemedMemberFunds(bytes32 member, uint amount);
  //===========================================================================
  /**
   * modifiers
   */
  //===========================================================================
  modifier  ownerOnly {
    require(msg.sender == owner);
    _;
  }

  modifier isValidMember (bytes32 member) {
    require(memberList[member] > 0);
    _;
  }
  //===========================================================================
  /**
   * functions
   */
  //===========================================================================
  function Cayso(uint initialSupply) {
    owner = msg.sender;
    balance = initialSupply;
    StartedNetwork(true);
  }

  function getBalance() ownerOnly constant returns (uint) {
    return balance;// simply return the existing balance
  }

  function getOwner() constant returns (address) {
    return owner;// simply return the contract instance owner
  }

  function getTotalMembers() ownerOnly constant returns (uint) {
    return memberCount;// simply return the value of memberCount
  }

  function addMember(bytes32 member) ownerOnly returns (bool success) {
    if(memberList[member] > 0) {// ensure member not already on the network
      DuplicateMember(member);
      return false;
    }
    balance -= 100;// deduct 100 units from gloabl balance
    memberList[member] = now;// add member to memberList and mark date member joined
    memberCount++;// increment memberCount state var
    balances[member] = 100; //add 100 units to the member
    NewMember(member, balances[member]);// emit newMember event
    return true;
  }

  function removeMember(bytes32 member) ownerOnly returns (bool success) {
    if(memberList[member] == 0) {// ensure member is on the network
      NonExistentMember(member);
      return false;
    }
    delete(memberList[member]);// remove member from memberList
    memberCount--;// decrement memberCount state var
    delete(balances[member]);// remove member from balances array
    RemovedMember(member);// emit RemovedMember event
    return true;
  }

  function creditMember(bytes32 member, uint amount) ownerOnly returns(bool success) {
    if(balance < amount) {// confirm funds sufficient to execute transaction
      InsufficientFunds(amount, balance);
      return false;
    }
    if(memberList[member] == 0) {// confirm member exists
      NonExistentMember(member);
      return false;
    }
    balance -= amount;// deduct amount from balance
    balances[member] += amount;// send the amount to the address
    SentFunds(member, amount, balance);// emit event so dapp can handle it
    return true;
  }

  function redeemMemberFunds(bytes32 member, uint amount) ownerOnly isValidMember(member) returns (bool success) {
    if(balances[member] < amount) {//ensure member has enough funds to cover the redemption
      var memberBalance = balances[member];
      InsufficientFunds(amount, memberBalance);
      return false;
    }
    balances[member] -= amount;// deduct requested amount from member balance
    balance += amount;// add redeemed amount to global balance
    RedeemedMemberFunds(member, amount);// emit RedeemedMemberFunds event
    return true;
  }

  function receiveFunds() payable returns(bool success) {
    var amount = msg.value;
    var origBalance = balance;
    if(amount < 0) revert();// confirm amount is not -ve
    balance += amount;// add amount to balance
    ReceivedFunds(origBalance, balance);// emit event so dapp can handle it
    return true;
  }

  function getMemberBalance(bytes32 member) constant returns(uint) {
    return balances[member];
  }

  function transferMemberFunds(bytes32 sender, bytes32 recipient, uint amount, bool restrictionFlag) isValidMember(sender) returns(bool success) {
    require(restrictionFlag != false);//ensure the member is not under restriction
    require(sender != recipient);// ensure member not sending funds to self
    if(balances[sender] < amount) {//confirm sufficient funds
      InsufficientMemberFunds(sender, amount, balance);
      return false;
    }
    if(memberList[recipient] == 0) {// confirm valid recipient
      NonExistentMember(recipient);
      return false;
    }
    balances[sender] -= amount;// deduct amount from memberBalance
    balances[recipient] += amount;// send the amount to the recipient
    var currentBalance = balances[sender];
    SentMemberFunds(recipient, amount, currentBalance);// emit event so dapp can handle it
    return true;
  }

  function seppuku() ownerOnly {
    suicide(owner);
  }
}
//=============================================================================
