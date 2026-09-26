// ============================================
// 《大明国策》v3.2 朝代对比
// ============================================

function renderCompare() {
    const imports = JSON.parse(localStorage.getItem('daming_imports') || '[]');
    
    if (imports.length === 0) {
        return `
            <h3 class="section-title">朝代对比</h3>
            <div class="empty-state">尚未导入其他朝代。前往"分享"页导入他人的分享码。</div>
        `;
    }
    
    const myData = GameState.script ? JSON.parse(base64Decode(encodeShare())) : null;
    
    return `
        <h3 class="section-title">朝代对比</h3>
        <div class="compare-header">
            <div class="compare-col">
                <div class="compare-name">朕之朝</div>
                ${myData ? renderCompareRow(myData) : '<div class="empty-state">无当前朝代</div>'}
            </div>
            ${imports.slice(0, 3).map((imp, i) => `
                <div class="compare-col">
                    <div class="compare-name">第${i+1}朝</div>
                    ${renderCompareRow(imp)}
                </div>
            `).join('')}
        </div>
        <h3 class="section-title">逐项对比</h3>
        ${myData ? renderDetailedCompare(myData, imports) : ''}
    `;
}

function renderCompareRow(data) {
    return `
        <div class="compare-rating">「${data.rating}」</div>
        <div class="compare-score">${data.score}分</div>
        <div class="compare-stats">
            <div>国库 ${data.res.tr}两</div>
            <div>军力 ${data.res.mp}</div>
            <div>人口 ${data.res.po}万</div>
            <div>稳定 ${data.res.st}</div>
        </div>
    `;
}

function renderDetailedCompare(my, imports) {
    const fields = [
        { name: '综合分', key: 'score', unit: '' },
        { name: '国库', key: 'res.tr', unit: '两' },
        { name: '军力', key: 'res.mp', unit: '' },
        { name: '人口', key: 'res.po', unit: '万' },
        { name: '天命', key: 'res.mn', unit: '' },
        { name: '稳定', key: 'res.st', unit: '' },
        { name: '腐败', key: 'res.cr', unit: '' },
        { name: '决策', key: 'decisions', unit: '次' },
        { name: '成就', key: 'achievements', unit: '个' }
    ];
    
    function get(obj, path) {
        return path.split('.').reduce((o, k) => o && o[k], obj);
    }
    
    return `
        <table class="compare-table">
            <thead>
                <tr>
                    <th>指标</th>
                    <th>朕</th>
                    ${imports.slice(0, 3).map((_, i) => `<th>第${i+1}朝</th>`).join('')}
                </tr>
            </thead>
            <tbody>
                ${fields.map(f => {
                    const myVal = get(my, f.key);
                    const myClass = myVal > 50 ? 'good' : myVal < 30 ? 'bad' : '';
                    return `
                        <tr>
                            <td>${f.name}</td>
                            <td class="${myClass}">${myVal}${f.unit}</td>
                            ${imports.slice(0, 3).map(imp => {
                                const v = get(imp, f.key);
                                const c = v > 50 ? 'good' : v < 30 ? 'bad' : '';
                                return `<td class="${c}">${v}${f.unit}</td>`;
                            }).join('')}
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

console.log('✓ 朝代对比 v3.2 加载完成');