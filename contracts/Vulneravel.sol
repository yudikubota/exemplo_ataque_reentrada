// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

// Import this file to use console.log
import "hardhat/console.sol";

contract Vulneravel {
    mapping(address => uint256) public saldo;

    function depositar() payable public {
        // console.log(string.concat("depositar() { value: ", msg.value.toString(), " }"));
        saldo[msg.sender] += msg.value;
    }

    function resgatar() public {
        console.log("resgatar()");

        // Vamos assumir que o resgatante é o chamador desta função
        address payable resgatante = payable(msg.sender);

        // Verifica se o resgatante tem saldo
        require(saldo[resgatante] > 0, "Nao ha saldo a ser resgatado.");

        // Realiza a transferência de todo o saldo disponível
        uint256 quantia = saldo[resgatante];
        (bool os, ) = resgatante.call{value: quantia}('');
        require(os);

        // Atualiza o saldo
        delete saldo[resgatante];

        // console.log(string.concat("resgatado ", quantia.toString(), "."));
    }

    function saldoTotal() public view returns (uint256) {
        return address(this).balance;
    }
}
