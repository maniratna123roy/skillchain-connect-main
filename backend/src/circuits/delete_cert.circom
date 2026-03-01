pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/poseidon.circom";

template DeleteCert() {
    signal input wallet;
    signal input asset_id;

    signal input wallet_hash;
    signal input asset_id_public;

    // Validate asset ID matches public signal
    asset_id === asset_id_public;

    // Hash the wallet to verify ownership without revealing it
    component poseidon = Poseidon(1);
    poseidon.inputs[0] <== wallet;

    wallet_hash === poseidon.out;
}

component main {public [wallet_hash, asset_id_public]} = DeleteCert();
