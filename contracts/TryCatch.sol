// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;

contract A {
    uint public data;
    function inc(uint a) external returns(uint) {
        data = a; // It will be reverted if the following require condition isn't satisfied.
        require(a < 10, "too big");
        return a + 1;
    }
}

contract B {
    A a;
    string public s;
    uint public b;

    constructor (address addr) {
        a = A(addr);
    }

    function test(uint data) external returns(uint, string memory) {
        try a.inc(data) returns (uint r) {
            b = r;
            s = "OK";
        } catch Error(string memory err) {
            b = 0;
            s = err;
        }
        return (b, s);
    }
}

contract C {
    B b;
    uint public data;
    string public err;
    
    constructor (address _b) {
        b = B(_b);
    }

    function invoke(uint a) external {
        (data, err) = b.test(a);
        return;
    }
}