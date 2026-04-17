if (!localStorage.getItem('jwt')) {
    window.location.href = 'login.html';
}

document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('jwt');
    localStorage.removeItem('userId');
    window.location.href = 'login.html';
});

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadProfileData();
    } catch (error) {
        console.error('Error loading profile:', error);
        alert('Failed to load profile data. Please try again.');
    }
});

async function loadProfileData() {
    try {
        showLoading();
        
        const data = await window.GraphQL.getAllProfileData();
        
        displayUserInfo(data.user[0]);
        
        displayXPInfo(data.transaction);
        
        displayAuditInfo(data.user[0]);
        
        window.Charts.createXPChart(data.transaction);
        window.Charts.createProjectChart(data.transaction);
        window.Charts.createSuccessChart(data.progress);
        
        hideLoading();
        
    } catch (error) {
        console.error('Error in loadProfileData:', error);
        throw error;
    }
}

function displayUserInfo(user) {
    if (!user) return;
    
    document.getElementById('userId').textContent = user.id || 'N/A';
    document.getElementById('userLogin').textContent = user.login || 'N/A';
    document.getElementById('userEmail').textContent = user.email || 'N/A';
}

function displayXPInfo(transactions) {
    if (!transactions || transactions.length === 0) {
        document.getElementById('totalXp').textContent = '0';
        return;
    }
    
    const totalXP = transactions.reduce((sum, t) => sum + t.amount, 0);
    document.getElementById('totalXp').textContent = totalXP.toLocaleString();
    
    const projectXP = {};
    transactions.forEach(t => {
        const projectName = t.object?.name || t.path?.split('/').pop() || 'Unknown';
        projectXP[projectName] = (projectXP[projectName] || 0) + t.amount;
    });
    
    const topProjects = Object.entries(projectXP)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    const xpDetails = document.getElementById('xpDetails');
    xpDetails.innerHTML = '';
    
    topProjects.forEach(([name, amount]) => {
        const item = document.createElement('div');
        item.className = 'xp-item';
        item.innerHTML = `
            <div class="xp-item-name">${name}</div>
            <div class="xp-item-amount">${amount.toLocaleString()} XP</div>
        `;
        xpDetails.appendChild(item);
    });
}

function displayAuditInfo(user) {
    if (!user) return;
    
    const auditsDone = user.totalUp || 0;
    const auditsReceived = user.totalDown || 0;
    const auditRatio = user.auditRatio || 0;
    
    document.getElementById('auditsDone').textContent = Math.round(auditsDone).toLocaleString();
    document.getElementById('auditsReceived').textContent = Math.round(auditsReceived).toLocaleString();
    document.getElementById('auditRatio').textContent = auditRatio.toFixed(2);
    
    const ratioElement = document.getElementById('auditRatio');
    if (auditRatio >= 1) {
        ratioElement.style.color = '#48bb78';
    } else if (auditRatio >= 0.7) {
        ratioElement.style.color = '#ed8936';
    } else {
        ratioElement.style.color = '#f56565';
    }
}

function showLoading() {
    document.querySelectorAll('.value').forEach(el => {
        el.classList.add('loading');
        el.textContent = 'Loading...';
    });
}

function hideLoading() {
    document.querySelectorAll('.value').forEach(el => {
        el.classList.remove('loading');
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatNumber(num) {
    return new Intl.NumberFormat().format(num);
}