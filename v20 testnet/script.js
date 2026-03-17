// ========================================
// CONFIGURAÇÕES DA REDE BASE E TOKENS
// ========================================
const CONFIG = {
    presaleEndDate: new Date('2026-03-18T20:00:00Z').getTime(),
    exchangeRate: 10000,
    tokenPrice: 0.0001,
    network: {
        name: 'Base',
        chainId: '0x2105',
        chainIdDecimal: 8453,
        rpcUrl: 'https://mainnet.base.org',
        blockExplorer: 'https://basescan.org'
    },
    tokens: {
        USDC: {
            address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            decimals: 6,
            symbol: 'USDC'
        },
        USDT: {
            address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
            decimals: 6,
            symbol: 'USDT'
        }
    },
    sfomoToken: {
        address: '0x8cc88849C4851e185A8FfF2C554A58FFe1aC6b68',
        decimals: 18,
        symbol: 'SFOMO'
    },
    presaleContract: '0x1366251D9650fd3987c0De313C04b1C73f03C83d'
};

// ========================================
// ABIs MÍNIMAS NECESSÁRIAS
// ========================================
const ERC20_ABI = [
    {
        "constant": true,
        "inputs": [{ "name": "_owner", "type": "address" }],
        "name": "balanceOf",
        "outputs": [{ "name": "balance", "type": "uint256" }],
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            { "name": "_spender", "type": "address" },
            { "name": "_value", "type": "uint256" }
        ],
        "name": "approve",
        "outputs": [{ "name": "", "type": "bool" }],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            { "name": "_owner", "type": "address" },
            { "name": "_spender", "type": "address" }
        ],
        "name": "allowance",
        "outputs": [{ "name": "", "type": "uint256" }],
        "type": "function"
    }
];

const PRESALE_ABI = [
    {
        "inputs": [{ "name": "amount", "type": "uint256" }],
        "name": "buyTokens",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "tokenPrice",
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "name": "user", "type": "address" }],
        "name": "claimableAmount",
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "claimTokens",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

// ========================================
// ESTADO DA APLICAÇÃO
// ========================================
let web3 = null;
let account = null;
let currentToken = 'USDC';
let isApproved = false;

// ========================================
// ELEMENTOS DO DOM
// ========================================
const elements = {
    payAmount: document.getElementById('payAmount'),
    receiveAmount: document.getElementById('receiveAmount'),
    payToken: document.getElementById('payToken'),
    payTokenLabel: document.getElementById('payTokenLabel'),
    connectWalletBtn: document.getElementById('connectWalletBtn'),
    approveTokenBtn: document.getElementById('approveTokenBtn'),
    confirmPurchaseBtn: document.getElementById('confirmPurchaseBtn'),
    disconnectWalletBtn: document.getElementById('disconnectWalletBtn'),
    walletInfo: document.getElementById('walletInfo'),
    walletAddress: document.getElementById('walletAddress'),
    walletBalance: document.getElementById('walletBalance'),
    walletNetwork: document.getElementById('walletNetwork'),
    networkWarning: document.getElementById('networkWarning'),
    contractAddress: document.getElementById('contractAddress'),
    usdcBalance: document.getElementById('usdcBalance'),
    usdtBalance: document.getElementById('usdtBalance'),
    switchNetworkBtn: document.getElementById('switchNetworkBtn'),
    approveTokenName: document.getElementById('approveTokenName'),
    walletStatus: document.getElementById('walletStatus'),
    statusAddress: document.getElementById('statusAddress'),
    statusBalance: document.getElementById('statusBalance'),
    approvalText: document.getElementById('approvalText'),
    currentRate: document.getElementById('currentRate'),
    claimSection: document.getElementById('claimSection'),
    claimBtn: document.getElementById('claimBtn'),
    claimableAmount: document.getElementById('claimableAmount'),
    claimStatus: document.getElementById('claimStatus'),
    presaleCountdown: document.getElementById('presaleCountdown'),
    daysLeft: document.getElementById('daysLeft'),
    hoursLeft: document.getElementById('hoursLeft'),
    minutesLeft: document.getElementById('minutesLeft'),
    secondsLeft: document.getElementById('secondsLeft')
};

// ========================================
// INICIALIZAÇÃO
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🦸 SFOMO Token - Pre-Sale Active!');
    console.log(`💰 Token Price: $${CONFIG.tokenPrice} (FIXED)`);
    console.log(`📊 Exchange Rate: 1 USDC/USDT = ${CONFIG.exchangeRate.toLocaleString()} SFOMO`);
    console.log(`🌐 Network: ${CONFIG.network.name} (Chain ID: ${CONFIG.network.chainIdDecimal})`);
    console.log(`⏰ Pre-Sale Ends: ${new Date(CONFIG.presaleEndDate).toLocaleString()}`);
    
    initializeApp();
    setupEventListeners();
    checkExistingConnection();
    startPresaleCountdown();
});

function initializeApp() {
    calculateSwap();
}

function setupEventListeners() {
    if (elements.payAmount) {
        elements.payAmount.addEventListener('input', calculateSwap);
    }
    if (elements.payToken) {
        elements.payToken.addEventListener('change', handleTokenChange);
    }
    if (elements.connectWalletBtn) {
        elements.connectWalletBtn.addEventListener('click', connectWallet);
    }
    if (elements.approveTokenBtn) {
        elements.approveTokenBtn.addEventListener('click', approveToken);
    }
    if (elements.confirmPurchaseBtn) {
        elements.confirmPurchaseBtn.addEventListener('click', buyTokens);
    }
    if (elements.disconnectWalletBtn) {
        elements.disconnectWalletBtn.addEventListener('click', disconnectWallet);
    }
    if (elements.switchNetworkBtn) {
        elements.switchNetworkBtn.addEventListener('click', switchToBaseNetwork);
    }
    if (elements.claimBtn) {
        elements.claimBtn.addEventListener('click', claimTokens);
    }

    if (window.ethereum) {
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);
    }
}

function handleTokenChange() {
    currentToken = elements.payToken.value;
    elements.payTokenLabel.textContent = currentToken;
    elements.approveTokenName.textContent = currentToken;
    elements.currentRate.textContent = `1 ${currentToken} = ${CONFIG.exchangeRate.toLocaleString()} SFOMO`;
    calculateSwap();
    if (account) {
        checkApproval();
    }
}

function calculateSwap() {
    const amount = parseFloat(elements.payAmount.value) || 0;
    const received = amount * CONFIG.exchangeRate;
    elements.receiveAmount.value = received.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

// ========================================
// COUNTDOWN DO PRESALE
// ========================================
function startPresaleCountdown() {
    const countdownInterval = setInterval(() => {
        const now = new Date().getTime();
        const distance = CONFIG.presaleEndDate - now;
        
        if (distance < 0) {
            clearInterval(countdownInterval);
            if (elements.presaleCountdown) {
                elements.presaleCountdown.innerHTML = '<span style="color: var(--red-bright); font-weight: 700; font-family: \'Bangers\', cursive; font-size: 28px;">ENDED</span>';
            }
            showClaimSection();
            return;
        }
        
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        if (elements.daysLeft) elements.daysLeft.textContent = String(days).padStart(2, '0');
        if (elements.hoursLeft) elements.hoursLeft.textContent = String(hours).padStart(2, '0');
        if (elements.minutesLeft) elements.minutesLeft.textContent = String(minutes).padStart(2, '0');
        if (elements.secondsLeft) elements.secondsLeft.textContent = String(seconds).padStart(2, '0');
    }, 1000);
}

// ========================================
// CLAIM SECTION
// ========================================
function showClaimSection() {
    const claimSection = document.getElementById('claimSection');
    const swapContainer = document.querySelector('.swap-container');
    if (claimSection && swapContainer) {
        swapContainer.style.display = 'none';
        claimSection.style.display = 'block';
        updateClaimableAmount();
    }
}

async function updateClaimableAmount() {
    if (!web3 || !account) return;
    try {
        const presaleContract = new web3.eth.Contract(PRESALE_ABI, CONFIG.presaleContract);
        const claimable = await presaleContract.methods.claimableAmount(account).call();
        const claimableFormatted = parseInt(claimable) / Math.pow(10, CONFIG.sfomoToken.decimals);
        
        if (elements.claimableAmount) {
            elements.claimableAmount.textContent = `${claimableFormatted.toLocaleString('en-US', { maximumFractionDigits: 2 })} SFOMO`;
        }
    } catch (error) {
        console.error('Erro ao buscar claimable amount:', error);
        if (elements.claimableAmount) {
            elements.claimableAmount.textContent = '0 SFOMO';
        }
    }
}

async function claimTokens() {
    if (!web3 || !account) {
        showNotification('Please connect your wallet first.', 'error');
        return;
    }
    
    if (elements.claimBtn) {
        elements.claimBtn.disabled = true;
        elements.claimBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Claiming...';
    }

    if (elements.claimStatus) {
        elements.claimStatus.textContent = 'Processing claim transaction...';
        elements.claimStatus.className = 'claim-status pending';
    }

    try {
        const presaleContract = new web3.eth.Contract(PRESALE_ABI, CONFIG.presaleContract);
        
        const gasEstimate = await presaleContract.methods.claimTokens().estimateGas({ from: account });
        
        const tx = await presaleContract.methods.claimTokens().send({
            from: account,
            gas: gasEstimate
        });
        
        console.log('Claim confirmado:', tx.transactionHash);
        
        if (elements.claimStatus) {
            elements.claimStatus.textContent = `✅ Success! Tokens claimed! TX: ${tx.transactionHash.slice(0, 20)}...`;
            elements.claimStatus.className = 'claim-status success';
        }
        
        if (elements.claimBtn) {
            elements.claimBtn.innerHTML = '<i class="fas fa-check-circle"></i> Tokens Claimed';
        }
        
        showNotification('🎉 Tokens claimed successfully!', 'success', 8000);
        
        await updateClaimableAmount();
        
    } catch (error) {
        console.error('Erro no claim:', error);
        
        if (elements.claimStatus) {
            elements.claimStatus.textContent = 'Claim failed. Please try again.';
            elements.claimStatus.className = 'claim-status error';
        }
        
        if (elements.claimBtn) {
            elements.claimBtn.disabled = false;
            elements.claimBtn.innerHTML = '<i class="fas fa-download"></i> Claim Tokens';
        }
        
        if (error.code === 4001) {
            showNotification('Transaction rejected by user.', 'error');
        } else {
            showNotification('Claim failed. Check console.', 'error');
        }
    }
}

// ========================================
// CONEXÃO WALLET
// ========================================
async function checkExistingConnection() {
    if (window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                await initializeWeb3(accounts[0]);
            }
        } catch (error) {
            console.error('Erro ao verificar conexão:', error);
        }
    }
}

async function connectWallet() {
    console.log('🔍 Tentando conectar wallet...');
    
    if (typeof window.ethereum === 'undefined') {
        console.log('❌ Nenhuma wallet encontrada');
        showNotification('No crypto wallet found! Please install MetaMask.', 'error');
        setTimeout(async () => {
            if (typeof window.ethereum !== 'undefined') {
                console.log('✅ Wallet detectada após delay');
                await connectWallet();
            }
        }, 1000);
        return;
    }

    try {
        console.log('✅ Wallet detectada:', window.ethereum.isMetaMask ? 'MetaMask' : 'Outra wallet');
        
        elements.connectWalletBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
        elements.connectWalletBtn.disabled = true;
        
        const accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
        });
        
        console.log('📬 Contas retornadas:', accounts);
        
        if (accounts.length > 0) {
            console.log('✅ Iniciando Web3 com conta:', accounts[0]);
            await initializeWeb3(accounts[0]);
        } else {
            throw new Error('No accounts returned');
        }
        
    } catch (error) {
        console.error('❌ Erro ao conectar wallet:', error);
        
        if (error.code === 4001) {
            showNotification('Connection rejected by user.', 'error');
        } else if (error.code === -32002) {
            showNotification('Another request is pending. Please complete it first.', 'error');
        } else {
            showNotification('Failed to connect: ' + error.message, 'error');
        }
        
        elements.connectWalletBtn.innerHTML = '<i class="fas fa-wallet"></i> Connect Wallet';
        elements.connectWalletBtn.disabled = false;
    }
}

async function initializeWeb3(address) {
    try {
        if (typeof Web3 === 'undefined') {
            throw new Error('Web3 not loaded');
        }
        
        console.log('Criando instância Web3...');
        
        web3 = new Web3(window.ethereum);
        account = address.toLowerCase();
        
        console.log('✅ Web3 inicializado. Conta:', account);
        
        const chainId = await web3.eth.getChainId();
        console.log('🔗 Chain ID atual:', chainId);
        
        if (chainId !== CONFIG.network.chainIdDecimal) {
            console.log('⚠️ Rede incorreta. Solicitando mudança para Base...');
            showNotification('Please switch to Base Network', 'info');
            await switchToBaseNetwork();
            return;
        }
        
        await updateWalletUI();
        await checkApproval();
        
        elements.connectWalletBtn.style.display = 'none';
        elements.walletInfo.style.display = 'block';
        elements.walletStatus.style.display = 'block';
        elements.disconnectWalletBtn.style.display = 'inline-flex';
        
        if (isApproved) {
            elements.approveTokenBtn.style.display = 'none';
            elements.confirmPurchaseBtn.style.display = 'block';
        } else {
            elements.approveTokenBtn.style.display = 'block';
            elements.confirmPurchaseBtn.style.display = 'none';
        }
        
        showNotification('Wallet Connected Successfully!', 'success');
        
        elements.connectWalletBtn.innerHTML = '<i class="fas fa-wallet"></i> Connect Wallet';
        elements.connectWalletBtn.disabled = false;
        
    } catch (error) {
        console.error('❌ Erro ao inicializar Web3:', error);
        showNotification('Error: ' + error.message, 'error');
        elements.connectWalletBtn.innerHTML = '<i class="fas fa-wallet"></i> Connect Wallet';
        elements.connectWalletBtn.disabled = false;
    }
}

// ========================================
// ATUALIZAÇÃO DA UI
// ========================================
async function updateWalletUI() {
    const shortAddress = account.slice(0, 6) + '...' + account.slice(-4);
    elements.walletAddress.textContent = shortAddress;
    elements.statusAddress.textContent = shortAddress;
    elements.contractAddress.textContent = CONFIG.sfomoToken.address.slice(0, 10) + '...';
    await updateBalances();
}

async function updateBalances() {
    if (!web3 || !account) return;
    try {
        const ethBalance = await web3.eth.getBalance(account);
        const ethFormatted = web3.utils.fromWei(ethBalance, 'ether');
        elements.walletBalance.textContent = `${parseFloat(ethFormatted).toFixed(4)} ETH`;
        
        const usdcContract = new web3.eth.Contract(ERC20_ABI, CONFIG.tokens.USDC.address);
        const usdcBalance = await usdcContract.methods.balanceOf(account).call();
        const usdcFormatted = parseInt(usdcBalance) / Math.pow(10, CONFIG.tokens.USDC.decimals);
        elements.usdcBalance.textContent = usdcFormatted.toFixed(2);
        
        const usdtContract = new web3.eth.Contract(ERC20_ABI, CONFIG.tokens.USDT.address);
        const usdtBalance = await usdtContract.methods.balanceOf(account).call();
        const usdtFormatted = parseInt(usdtBalance) / Math.pow(10, CONFIG.tokens.USDT.decimals);
        elements.usdtBalance.textContent = usdtFormatted.toFixed(2);
        
        const currentBalance = currentToken === 'USDC' ? usdcFormatted : usdtFormatted;
        elements.statusBalance.textContent = `${currentBalance.toFixed(2)} ${currentToken}`;
        
    } catch (error) {
        console.error('Erro ao atualizar balances:', error);
    }
}

async function checkApproval() {
    if (!web3 || !account) return;
    try {
        const tokenConfig = CONFIG.tokens[currentToken];
        const tokenContract = new web3.eth.Contract(ERC20_ABI, tokenConfig.address);
        
        const allowance = await tokenContract.methods.allowance(
            account,
            CONFIG.presaleContract
        ).call();
        
        const amount = parseFloat(elements.payAmount.value) || 0;
        const amountWei = (amount * Math.pow(10, tokenConfig.decimals)).toString();
        
        isApproved = BigInt(allowance) >= BigInt(amountWei);
        
        if (isApproved) {
            elements.approveTokenBtn.style.display = 'none';
            elements.confirmPurchaseBtn.style.display = 'block';
            elements.approvalText.textContent = 'Approved ✓';
            elements.approvalText.className = 'approval-approved';
        } else {
            elements.approveTokenBtn.style.display = 'block';
            elements.confirmPurchaseBtn.style.display = 'none';
            elements.approvalText.textContent = 'Not Approved';
            elements.approvalText.className = 'approval-pending';
        }
        
    } catch (error) {
        console.error('Erro ao verificar aprovação:', error);
    }
}

// ========================================
// APROVAÇÃO DE TOKEN
// ========================================
async function approveToken() {
    const amount = elements.payAmount.value;
    if (!amount || amount <= 0) {
        showNotification('Please enter a valid amount first.', 'error');
        return;
    }
    
    try {
        elements.approveTokenBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Approving...';
        elements.approveTokenBtn.disabled = true;
        
        const tokenConfig = CONFIG.tokens[currentToken];
        const tokenContract = new web3.eth.Contract(ERC20_ABI, tokenConfig.address);
        
        const amountWei = (parseFloat(amount) * Math.pow(10, tokenConfig.decimals)).toString();
        
        const gasEstimate = await tokenContract.methods.approve(
            CONFIG.presaleContract,   
            amountWei
        ).estimateGas({ from: account });
        
        const tx = await tokenContract.methods.approve(
            CONFIG.presaleContract,
            amountWei
        ).send({
            from: account,
            gas: gasEstimate
        });
        
        console.log('Aprovação confirmada:', tx.transactionHash);
        
        await checkApproval();
        showNotification(`${currentToken} Approved Successfully!`, 'success');
        
        elements.approveTokenBtn.innerHTML = `<i class="fas fa-check-circle"></i> Approve ${currentToken}`;
        elements.approveTokenBtn.disabled = false;
        
    } catch (error) {
        console.error('Erro na aprovação:', error);
        if (error.code === 4001) {
            showNotification('Transaction rejected by user.', 'error');
        } else {
            showNotification('Approval failed. Try again.', 'error');
        }
        elements.approveTokenBtn.innerHTML = `<i class="fas fa-check-circle"></i> Approve ${currentToken}`;
        elements.approveTokenBtn.disabled = false;
    }
}

// ========================================
// COMPRA DE TOKENS
// ========================================
async function buyTokens() {
    const amount = parseFloat(elements.payAmount.value);
    if (!amount || amount <= 0) {
        showNotification('Please enter a valid amount.', 'error');
        return;
    }
    
    const currentBalance = parseFloat(currentToken === 'USDC' ? elements.usdcBalance.textContent : elements.usdtBalance.textContent);
    if (amount > currentBalance) {
        showNotification(`Insufficient ${currentToken} balance.`, 'error');
        return;
    }

    const sfomoAmount = (amount * CONFIG.exchangeRate).toLocaleString();

    const confirmed = confirm(
        `Confirm Purchase:\n\n` +
        `Pay: ${amount} ${currentToken}\n` +
        `Receive: ${sfomoAmount} SFOMO\n` +
        `Price: $0.0001 per SFOMO\n\n` +
        `Proceed with transaction?`
    );

    if (!confirmed) return;

    try {
        elements.confirmPurchaseBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        elements.confirmPurchaseBtn.disabled = true;
        
        const tokenConfig = CONFIG.tokens[currentToken];
        const tokenContract = new web3.eth.Contract(ERC20_ABI, tokenConfig.address);
        const presaleContract = new web3.eth.Contract(PRESALE_ABI, CONFIG.presaleContract);
        
        const amountWei = (amount * Math.pow(10, tokenConfig.decimals)).toString();
        
        const allowance = await tokenContract.methods.allowance(account, CONFIG.presaleContract).call();
        if (BigInt(allowance) < BigInt(amountWei)) {
            showNotification('Please approve tokens first.', 'error');
            await checkApproval();
            return;
        }
        
        const gasEstimate = await presaleContract.methods.buyTokens(amountWei).estimateGas({ from: account });
        
        const tx = await presaleContract.methods.buyTokens(amountWei).send({
            from: account,
            gas: gasEstimate
        });
        
        console.log('Compra confirmada:', tx.transactionHash);
        
        showNotification(
            `🎉 Success! Purchased ${sfomoAmount} SFOMO!\nTX: ${tx.transactionHash.slice(0, 20)}...`,
            'success',
            8000
        );
        
        await updateBalances();
        
        elements.confirmPurchaseBtn.innerHTML = '<i class="fas fa-exchange-alt"></i> Swap Now';
        elements.confirmPurchaseBtn.disabled = false;
        elements.payAmount.value = '100';
        calculateSwap();
        
    } catch (error) {
        console.error('Erro na compra:', error);
        if (error.code === 4001) {
            showNotification('Transaction rejected by user.', 'error');
        } else {
            showNotification('Transaction failed. Check console.', 'error');
        }
        elements.confirmPurchaseBtn.innerHTML = '<i class="fas fa-exchange-alt"></i> Swap Now';
        elements.confirmPurchaseBtn.disabled = false;
    }
}

// ========================================
// TROCA DE REDE
// ========================================
async function switchToBaseNetwork() {
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: CONFIG.network.chainId }],
        });
    } catch (switchError) {
        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: CONFIG.network.chainId,
                        chainName: CONFIG.network.name,
                        nativeCurrency: {
                            name: 'ETH',
                            symbol: 'ETH',
                            decimals: 18
                        },
                        rpcUrls: [CONFIG.network.rpcUrl],
                        blockExplorerUrls: [CONFIG.network.blockExplorer]
                    }]
                });
            } catch (addError) {
                showNotification('Failed to add Base network.', 'error');
                return;
            }
        } else {
            showNotification('Failed to switch network.', 'error');
            return;
        }
    }
    setTimeout(() => {
        window.location.reload();
    }, 1000);
}

// ========================================
// DESCONECTAR WALLET
// ========================================
function disconnectWallet() {
    account = null;
    web3 = null;
    isApproved = false;
    elements.connectWalletBtn.style.display = 'block';
    elements.walletInfo.style.display = 'none';
    elements.walletStatus.style.display = 'none';
    elements.disconnectWalletBtn.style.display = 'none';
    elements.approveTokenBtn.style.display = 'none';
    elements.confirmPurchaseBtn.style.display = 'none';
    elements.approvalText.textContent = 'Not Approved';
    elements.approvalText.className = 'approval-pending';
    showNotification('Wallet disconnected.', 'info');
}

function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        disconnectWallet();
    } else if (accounts[0].toLowerCase() !== account) {
        initializeWeb3(accounts[0]);
    }
}

function handleChainChanged(chainId) {
    window.location.reload();
}

// ========================================
// NOTIFICAÇÕES
// ========================================
function showNotification(message, type = 'info', duration = 3000) {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span style="white-space: pre-line;">${message}</span>
    `;

    Object.assign(notification.style, {
        position: 'fixed',
        top: '100px',
        right: '20px',
        padding: '20px 30px',
        background: type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6',
        color: 'white',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontWeight: '600',
        zIndex: '10000',
        animation: 'slideIn 0.3s ease',
        maxWidth: '450px',
        fontSize: '15px'
    });

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

// ========================================
// VALIDAÇÃO DE INPUT
// ========================================
if (elements.payAmount) {
    elements.payAmount.addEventListener('keydown', (e) => {
        if (e.key === '-') e.preventDefault();
    });
}

console.log('%c🦸 SFOMO PRE-SALE ACTIVE!', 'font-size: 30px; font-weight: bold; color: #FBBF24;');
console.log('%c💰 Price: $0.0001 | Network: Base', 'font-size: 16px; color: #10B981;');