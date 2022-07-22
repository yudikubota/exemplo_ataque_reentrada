// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

// Import this file to use console.log
import "hardhat/console.sol";
import '@openzeppelin/contracts/utils/Strings.sol';

contract Vulneravel {
    mapping(address => uint256) public saldo;
    using Strings for uint256;
    using Strings for address;

    constructor() {
        // console.log('Vulneravel: criado em %s', address(this));
    }

    function depositar() payable public {
        // console.log("depositar(): %s depositou { value: % wei }", msg.sender.toHexString(), msg.value);
        saldo[msg.sender] += msg.value;
    }

    function resgatar() public {
        // Vamos assumir que o resgatante é o chamador desta função
        address payable resgatante = payable(msg.sender);

        // console.log("resgatar(): %s tem %s wei a resgatar", resgatante, saldo[resgatante]);

        // Verifica se o resgatante tem saldo
        require(saldo[resgatante] > 0, "Nao ha saldo a ser resgatado.");

        // Realiza a transferência de todo o saldo disponível
        uint256 quantia = saldo[resgatante];
        (bool os, ) = resgatante.call{value: quantia}('');
        require(os, "Falha ao transferir fundos.");

        // Atualiza o saldo
        saldo[resgatante] = 0;

        // console.log("resgatar(): saldo de %s atualizado para 0", resgatante);
    }

    function saldoTotal() public view returns (uint256) {
        return address(this).balance;
    }

    function saldoDe(address _address) public view returns (uint256) {
        return saldo[_address];
    }
}
