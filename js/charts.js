function createXPChart(transactions) {
    const svg = document.getElementById('xpChart');
    svg.innerHTML = '';
    
    if (!transactions || transactions.length === 0) {
        svg.innerHTML = '<text x="400" y="150" text-anchor="middle" fill="#718096">No XP data available</text>';
        return;
    }
    
    const width = 800;
    const height = 300;
    const padding = { top: 20, right: 40, bottom: 40, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    let cumulativeXP = 0;
    const dataPoints = transactions.map(t => {
        cumulativeXP += t.amount;
        return {
            date: new Date(t.createdAt),
            xp: cumulativeXP
        };
    });
    
    const maxXP = Math.max(...dataPoints.map(d => d.xp));
    const minDate = dataPoints[0].date;
    const maxDate = dataPoints[dataPoints.length - 1].date;
    
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.setAttribute('id', 'gradient');
    gradient.setAttribute('x1', '0%');
    gradient.setAttribute('y1', '0%');
    gradient.setAttribute('x2', '0%');
    gradient.setAttribute('y2', '100%');
    
    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', '#667eea');
    stop1.setAttribute('stop-opacity', '0.3');
    
    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', '#667eea');
    stop2.setAttribute('stop-opacity', '0');
    
    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    defs.appendChild(gradient);
    svg.appendChild(defs);
    
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${padding.left}, ${padding.top})`);
    
    const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    xAxis.setAttribute('x1', 0);
    xAxis.setAttribute('y1', chartHeight);
    xAxis.setAttribute('x2', chartWidth);
    xAxis.setAttribute('y2', chartHeight);
    xAxis.setAttribute('class', 'chart-axis');
    g.appendChild(xAxis);
    
    const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    yAxis.setAttribute('x1', 0);
    yAxis.setAttribute('y1', 0);
    yAxis.setAttribute('x2', 0);
    yAxis.setAttribute('y2', chartHeight);
    yAxis.setAttribute('class', 'chart-axis');
    g.appendChild(yAxis);
    
    const xScale = (date) => {
        const ratio = (date - minDate) / (maxDate - minDate);
        return ratio * chartWidth;
    };
    
    const yScale = (value) => {
        return chartHeight - (value / maxXP) * chartHeight;
    };
    
    let pathData = `M ${xScale(dataPoints[0].date)} ${yScale(dataPoints[0].xp)}`;
    for (let i = 1; i < dataPoints.length; i++) {
        pathData += ` L ${xScale(dataPoints[i].date)} ${yScale(dataPoints[i].xp)}`;
    }
    
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    line.setAttribute('d', pathData);
    line.setAttribute('class', 'chart-line');
    g.appendChild(line);
    
    let areaData = pathData + ` L ${xScale(dataPoints[dataPoints.length - 1].date)} ${chartHeight} L ${xScale(dataPoints[0].date)} ${chartHeight} Z`;
    const area = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    area.setAttribute('d', areaData);
    area.setAttribute('class', 'chart-area');
    g.insertBefore(area, line);
    
    dataPoints.forEach((point, i) => {
        if (i % Math.ceil(dataPoints.length / 10) === 0 || i === dataPoints.length - 1) {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', xScale(point.date));
            circle.setAttribute('cy', yScale(point.xp));
            circle.setAttribute('r', 5);
            circle.setAttribute('class', 'chart-point');
            
            const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            title.textContent = `${point.date.toLocaleDateString()}: ${point.xp.toLocaleString()} XP`;
            circle.appendChild(title);
            
            g.appendChild(circle);
        }
    });
    
    for (let i = 0; i <= 5; i++) {
        const value = (maxXP / 5) * i;
        const y = chartHeight - (i / 5) * chartHeight;
        
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', -10);
        label.setAttribute('y', y + 4);
        label.setAttribute('text-anchor', 'end');
        label.setAttribute('class', 'chart-axis-text');
        label.textContent = Math.round(value).toLocaleString();
        g.appendChild(label);
    }
    
    svg.appendChild(g);
}

function createProjectChart(transactions) {
    const svg = document.getElementById('projectChart');
    svg.innerHTML = '';
    
    if (!transactions || transactions.length === 0) {
        svg.innerHTML = '<text x="400" y="150" text-anchor="middle" fill="#718096">No project data available</text>';
        return;
    }
    
    const projectXP = {};
    transactions.forEach(t => {
        const projectName = t.object?.name || t.path?.split('/').pop() || 'Unknown';
        projectXP[projectName] = (projectXP[projectName] || 0) + t.amount;
    });
    
    const sortedProjects = Object.entries(projectXP)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    const width = 800;
    const height = 300;
    const padding = { top: 20, right: 40, bottom: 60, left: 100 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${padding.left}, ${padding.top})`);
    
    const maxXP = Math.max(...sortedProjects.map(p => p[1]));
    const barHeight = chartHeight / sortedProjects.length;
    
    sortedProjects.forEach((project, i) => {
        const [name, xp] = project;
        const barWidth = (xp / maxXP) * chartWidth;
        const y = i * barHeight;
        
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', 0);
        rect.setAttribute('y', y + barHeight * 0.1);
        rect.setAttribute('width', barWidth);
        rect.setAttribute('height', barHeight * 0.8);
        rect.setAttribute('class', 'chart-bar');
        rect.setAttribute('fill', `hsl(${250 - i * 10}, 70%, 60%)`);
        
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        title.textContent = `${name}: ${xp.toLocaleString()} XP`;
        rect.appendChild(title);
        
        g.appendChild(rect);
        
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', -10);
        label.setAttribute('y', y + barHeight / 2 + 4);
        label.setAttribute('text-anchor', 'end');
        label.setAttribute('class', 'chart-label');
        label.textContent = name.length > 15 ? name.substring(0, 15) + '...' : name;
        g.appendChild(label);
        
        const valueLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        valueLabel.setAttribute('x', barWidth + 5);
        valueLabel.setAttribute('y', y + barHeight / 2 + 4);
        valueLabel.setAttribute('class', 'chart-label');
        valueLabel.textContent = xp.toLocaleString();
        g.appendChild(valueLabel);
    });
    
    svg.appendChild(g);
}

function createSuccessChart(progressData) {
    const svg = document.getElementById('successChart');
    svg.innerHTML = '';
    
    if (!progressData || progressData.length === 0) {
        svg.innerHTML = '<text x="200" y="150" text-anchor="middle" fill="#718096">No progress data available</text>';
        return;
    }
    
    let passCount = 0;
    let failCount = 0;
    
    progressData.forEach(p => {
        if (p.grade !== null && p.grade !== undefined) {
            if (p.grade >= 1) {
                passCount++;
            } else {
                failCount++;
            }
        }
    });
    
    const total = passCount + failCount;
    if (total === 0) {
        svg.innerHTML = '<text x="200" y="150" text-anchor="middle" fill="#718096">No graded projects</text>';
        return;
    }
    
    const centerX = 200;
    const centerY = 150;
    const radius = 100;
    
    const passAngle = (passCount / total) * 360;
    const failAngle = (failCount / total) * 360;
    
    function createArc(startAngle, endAngle, radius, centerX, centerY) {
        const start = polarToCartesian(centerX, centerY, radius, endAngle);
        const end = polarToCartesian(centerX, centerY, radius, startAngle);
        const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
        
        return [
            "M", centerX, centerY,
            "L", start.x, start.y,
            "A", radius, radius, 0, largeArc, 0, end.x, end.y,
            "Z"
        ].join(" ");
    }
    
    function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
        const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
        return {
            x: centerX + (radius * Math.cos(angleInRadians)),
            y: centerY + (radius * Math.sin(angleInRadians))
        };
    }
    
    const passPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    passPath.setAttribute('d', createArc(0, passAngle, radius, centerX, centerY));
    passPath.setAttribute('fill', '#48bb78');
    passPath.setAttribute('class', 'pie-slice');
    
    const passTitle = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    passTitle.textContent = `Pass: ${passCount} (${((passCount/total)*100).toFixed(1)}%)`;
    passPath.appendChild(passTitle);
    
    svg.appendChild(passPath);
    
    const failPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    failPath.setAttribute('d', createArc(passAngle, 360, radius, centerX, centerY));
    failPath.setAttribute('fill', '#f56565');
    failPath.setAttribute('class', 'pie-slice');
    
    const failTitle = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    failTitle.textContent = `Fail: ${failCount} (${((failCount/total)*100).toFixed(1)}%)`;
    failPath.appendChild(failTitle);
    
    svg.appendChild(failPath);
    
    const passLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    passLabel.setAttribute('x', centerX - 40);
    passLabel.setAttribute('y', centerY - 20);
    passLabel.setAttribute('class', 'chart-label');
    passLabel.setAttribute('fill', '#48bb78');
    passLabel.setAttribute('font-weight', 'bold');
    passLabel.textContent = `✓ ${passCount}`;
    svg.appendChild(passLabel);
    
    const failLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    failLabel.setAttribute('x', centerX - 40);
    failLabel.setAttribute('y', centerY + 10);
    failLabel.setAttribute('class', 'chart-label');
    failLabel.setAttribute('fill', '#f56565');
    failLabel.setAttribute('font-weight', 'bold');
    failLabel.textContent = `✗ ${failCount}`;
    svg.appendChild(failLabel);
    
    const percentage = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    percentage.setAttribute('x', centerX - 40);
    percentage.setAttribute('y', centerY + 40);
    percentage.setAttribute('class', 'chart-label');
    percentage.setAttribute('font-size', '18');
    percentage.setAttribute('font-weight', 'bold');
    percentage.textContent = `${((passCount/total)*100).toFixed(1)}% Success`;
    svg.appendChild(percentage);
}

window.Charts = {
    createXPChart,
    createProjectChart,
    createSuccessChart
};