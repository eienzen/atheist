// Contract configuration
const projectId = 'e48a76cd2f08f0e5749c36152d1eee09';
const contractAddress = '0xYOUR_NEW_CONTRACT_ADDRESS_HERE'; // Remix से नया एड्रेस डालें
const contractABI = [
    {"inputs":[{"internalType":"uint256","name":"_baseFee","type":"uint256"},{"internalType":"uint256","name":"_feePerToken","type":"uint256"}],"name":"setTransferFee","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferWithFee","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"payable","type":"function"},
    {"inputs":[],"name":"collectFees","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[],"name":"claimReferralRewards","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256","name":"planIndex","type":"uint256"},{"internalType":"address","name":"referrer","type":"address"}],"name":"depositStake","outputs":[],"stateMutability":"payable","type":"function"},
    {"inputs":[{"internalType":"uint256","name":"stakeIndex","type":"uint256"}],"name":"unstake","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"internalType":"uint256","name":"planIndex","type":"uint256"},{"internalType":"uint256","name":"newAPR","type":"uint256"}],"name":"setStakingPlanAPR","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[],"name":"disableStaking","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"withdrawBNB","outputs":[],"stateMutability":"nonpayable","type":"function"},
    // अन्य फंक्शन्स जोड़ें
];

let web3, account, provider, isOwner = false;

document.addEventListener('DOMContentLoaded', async () => {
    // Web3 को सही तरीके से लोड करें
    if (typeof window.Web3 !== 'undefined') {
        web3 = new Web3(window.ethereum);
    } else {
        console.log('Web3 not detected, using WalletConnect');
        const WalletConnectProvider = window.WalletConnectProvider.default;
        provider = await WalletConnectProvider.init({
            projectId: projectId,
            chains: [97], // BNB Testnet
            showQrModal: true,
            rpcMap: { 97: 'https://data-seed-prebsc-1-s1.binance.org:8545' },
            optionalChains: [97],
            metadata: {
                name: 'Atheist Protocol',
                description: 'Decentralized staking platform',
                url: 'https://eienzen.github.io/atheist/',
                icons: ['https://raw.githubusercontent.com/eienzen/atheist/refs/heads/main/favicon.ico']
            }
        });
        web3 = new Web3(provider);
    }

    const connectWallet = document.getElementById('connectWallet');
    connectWallet.addEventListener('click', connectWalletHandler);

    const generateReferral = document.getElementById('generateReferral');
    generateReferral.addEventListener('click', generateReferralLink);

    async function connectWalletHandler() {
        try {
            let accounts;
            if (window.ethereum) {
                accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            } else if (provider) {
                await provider.enable();
                accounts = await web3.eth.getAccounts();
            }
            account = accounts[0];
            await checkOwnerStatus();
            updateUI();
            document.getElementById('status').textContent = 'Connected';
        } catch (error) {
            document.getElementById('status').textContent = 'Error connecting: ' + error.message;
        }
    }

    async function checkOwnerStatus() {
        if (web3 && account) {
            const contract = new web3.eth.Contract(contractABI, contractAddress);
            const owner = await contract.methods.owner().call();
            isOwner = web3.utils.toChecksumAddress(account) === web3.utils.toChecksumAddress(owner);
        }
    }

    function updateUI() {
        if (account) {
            document.getElementById('dashboard').classList.remove('hidden');
            document.getElementById('connectWallet').textContent = 'Connected: ' + account.substring(0, 6) + '...' + account.substring(account.length - 4);
            if (isOwner) {
                document.getElementById('ownerControls').classList.remove('hidden');
            }
            document.getElementById('userControls').classList.remove('hidden');
        }
    }

    function generateReferralLink() {
        if (account) {
            const referralLink = `https://eienzen.github.io/atheist/?ref=${account}`;
            const referralElement = document.getElementById('referralLink');
            referralElement.textContent = referralLink;
            referralElement.classList.remove('hidden');
            navigator.clipboard.writeText(referralLink).then(() => {
                document.getElementById('status').textContent = 'Referral link copied!';
            }).catch(() => {
                document.getElementById('status').textContent = 'Error copying link.';
            });
        } else {
            document.getElementById('status').textContent = 'Please connect a wallet first.';
        }
    }

    let contract = new web3.eth.Contract(contractABI, contractAddress);

    // Update Fee
    document.getElementById('updateFeeButton').addEventListener('click', async () => {
        if (isOwner && account) {
            const baseFee = web3.utils.toWei(document.getElementById('baseFeeInput').value || '0', 'ether');
            const feePerToken = web3.utils.toWei(document.getElementById('feePerTokenInput').value || '0', 'ether');
            await contract.methods.setTransferFee(baseFee, feePerToken).send({ from: account })
                .on('transactionHash', hash => document.getElementById('status').textContent = 'Transaction sent: ' + hash)
                .on('receipt', () => document.getElementById('status').textContent = 'Fee updated')
                .on('error', error => document.getElementById('status').textContent = 'Error: ' + error.message);
        } else {
            document.getElementById('status').textContent = 'Only owner can update fees.';
        }
    });

    // Update APR
    document.getElementById('updateAPRButton').addEventListener('click', async () => {
        if (isOwner && account) {
            const planIndex = document.getElementById('planIndexInput').value;
            const newAPR = document.getElementById('newAPRInput').value;
            await contract.methods.setStakingPlanAPR(planIndex, newAPR).send({ from: account })
                .on('transactionHash', hash => document.getElementById('status').textContent = 'Transaction sent: ' + hash)
                .on('receipt', () => document.getElementById('status').textContent = 'APR updated')
                .on('error', error => document.getElementById('status').textContent = 'Error: ' + error.message);
        } else {
            document.getElementById('status').textContent = 'Only owner can update APR.';
        }
    });

    // Disable Staking
    document.getElementById('disableStakingButton').addEventListener('click', async () => {
        if (isOwner && account) {
            await contract.methods.disableStaking().send({ from: account })
                .on('transactionHash', hash => document.getElementById('status').textContent = 'Transaction sent: ' + hash)
                .on('receipt', () => document.getElementById('status').textContent = 'Staking disabled')
                .on('error', error => document.getElementById('status').textContent = 'Error: ' + error.message);
        } else {
            document.getElementById('status').textContent = 'Only owner can disable staking.';
        }
    });

    // Withdraw BNB
    document.getElementById('withdrawBNBButton').addEventListener('click', async () => {
        if (isOwner && account) {
            const amount = document.getElementById('withdrawAmountInput').value;
            await contract.methods.withdrawBNB(amount).send({ from: account })
                .on('transactionHash', hash => document.getElementById('status').textContent = 'Transaction sent: ' + hash)
                .on('receipt', () => document.getElementById('status').textContent = 'BNB withdrawn')
                .on('error', error => document.getElementById('status').textContent = 'Error: ' + error.message);
        } else {
            document.getElementById('status').textContent = 'Only owner can withdraw BNB.';
        }
    });

    // Collect Fees
    document.getElementById('collectFeesButton').addEventListener('click', async () => {
        if (isOwner && account) {
            await contract.methods.collectFees().send({ from: account })
                .on('transactionHash', hash => document.getElementById('status').textContent = 'Transaction sent: ' + hash)
                .on('receipt', () => document.getElementById('status').textContent = 'Fees collected')
                .on('error', error => document.getElementById('status').textContent = 'Error: ' + error.message);
        } else {
            document.getElementById('status').textContent = 'Only owner can collect fees.';
        }
    });

    // Stake
    document.getElementById('stakeButton').addEventListener('click', async () => {
        if (account) {
            const amount = web3.utils.toWei(document.getElementById('stakeAmount').value, 'ether');
            const planIndex = document.getElementById('stakePlan').value;
            const referrer = document.getElementById('referrerAddress').value || '0x0000000000000000000000000000000000000000';
            await contract.methods.depositStake(amount, planIndex, referrer).send({ from: account, value: 0 })
                .on('transactionHash', hash => document.getElementById('status').textContent = 'Transaction sent: ' + hash)
                .on('receipt', () => document.getElementById('status').textContent = 'Staked successfully')
                .on('error', error => document.getElementById('status').textContent = 'Error: ' + error.message);
        } else {
            document.getElementById('status').textContent = 'Please connect a wallet first.';
        }
    });

    // Unstake
    document.getElementById('unstakeButton').addEventListener('click', async () => {
        if (account) {
            const stakeIndex = document.getElementById('unstakeIndex').value;
            await contract.methods.unstake(stakeIndex).send({ from: account })
                .on('transactionHash', hash => document.getElementById('status').textContent = 'Transaction sent: ' + hash)
                .on('receipt', () => document.getElementById('status').textContent = 'Unstaked successfully')
                .on('error', error => document.getElementById('status').textContent = 'Error: ' + error.message);
        } else {
            document.getElementById('status').textContent = 'Please connect a wallet first.';
        }
    });

    // Transfer with Fee
    document.getElementById('transferButton').addEventListener('click', async () => {
        if (account) {
            const recipient = document.getElementById('transferRecipient').value;
            const amount = web3.utils.toWei(document.getElementById('transferAmount').value, 'ether');
            const fee = await contract.methods.calculateTransferFee(amount).call();
            await contract.methods.transferWithFee(recipient, amount).send({ from: account, value: fee })
                .on('transactionHash', hash => document.getElementById('status').textContent = 'Transaction sent: ' + hash)
                .on('receipt', () => document.getElementById('status').textContent = 'Transferred successfully')
                .on('error', error => document.getElementById('status').textContent = 'Error: ' + error.message);
        } else {
            document.getElementById('status').textContent = 'Please connect a wallet first.';
        }
    });

    // Transfer From with Fee
    document.getElementById('transferFromButton').addEventListener('click', async () => {
        if (account) {
            const sender = document.getElementById('transferFromSender').value;
            const recipient = document.getElementById('transferFromRecipient').value;
            const amount = web3.utils.toWei(document.getElementById('transferFromAmount').value, 'ether');
            const fee = await contract.methods.calculateTransferFee(amount).call();
            await contract.methods.transferFromWithFee(sender, recipient, amount).send({ from: account, value: fee })
                .on('transactionHash', hash => document.getElementById('status').textContent = 'Transaction sent: ' + hash)
                .on('receipt', () => document.getElementById('status').textContent = 'Transferred successfully')
                .on('error', error => document.getElementById('status').textContent = 'Error: ' + error.message);
        } else {
            document.getElementById('status').textContent = 'Please connect a wallet first.';
        }
    });

    // Claim Referral Rewards
    document.getElementById('claimRewardsButton').addEventListener('click', async () => {
        if (account) {
            await contract.methods.claimReferralRewards().send({ from: account })
                .on('transactionHash', hash => document.getElementById('status').textContent = 'Transaction sent: ' + hash)
                .on('receipt', () => document.getElementById('status').textContent = 'Rewards claimed')
                .on('error', error => document.getElementById('status').textContent = 'Error: ' + error.message);
        } else {
            document.getElementById('status').textContent = 'Please connect a wallet first.';
        }
    });