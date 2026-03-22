
path = r'c:\Users\shiva\OneDrive\Documents\GitHub\QUIZ-\src\index.css'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = lines[:1773] # Keep lines before 1774 (0-indexed 1773)

correct_css = """/* Live Dashboard Styles */
.live-dashboard-card {
    background: white;
    border-radius: 32px;
    padding: 2.5rem;
    border: 1px solid #f1f5f9;
    box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.03);
}

.stat-card-premium {
    background: #f8fafc;
    border-radius: 24px;
    padding: 1.5rem;
    text-align: center;
    border: 1px solid #f1f5f9;
    transition: all 0.3s ease;
}

.stat-card-premium:hover {
    background: white;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
    transform: translateY(-2px);
}

.stat-value-premium {
    font-size: 2rem;
    font-weight: 900;
    color: #0f172a;
    line-height: 1;
    margin-bottom: 0.25rem;
}

.stat-label-premium {
    font-size: 0.75rem;
    font-weight: 800;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.live-leaderboard-item {
    display: flex;
    align-items: center;
    padding: 1.25rem;
    background: white;
    border-radius: 20px;
    margin-bottom: 0.75rem;
    border: 1px solid #f1f5f9;
    transition: all 0.2s ease;
}

.live-leaderboard-item:hover {
    border-color: #ff5c1a;
    transform: translateX(4px);
}

.rank-circle {
    width: 32px;
    height: 32px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
    font-size: 0.875rem;
    margin-right: 1.25rem;
}

.rank-gold { background: #fef9c3; color: #a16207; }
.rank-silver { background: #f1f5f9; color: #64748b; }
.rank-bronze { background: #ffedd5; color: #9a3412; }
.rank-default { background: #f8fafc; color: #94a3b8; }

.distribution-bar-wrapper {
    margin-bottom: 1.25rem;
}

.distribution-bar-label {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    font-weight: 800;
    font-size: 0.875rem;
}

.distribution-bar-outer {
    height: 12px;
    background: #f1f5f9;
    border-radius: 100px;
    overflow: hidden;
}

.distribution-bar-inner {
    height: 100%;
    border-radius: 100px;
    transition: width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.podium-container {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    gap: 2rem;
    padding: 4rem 2rem;
    margin-bottom: 4rem;
}

.podium-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 240px;
}

.podium-avatar {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: white;
    border: 4px solid white;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.5rem;
    margin-bottom: 1rem;
    z-index: 2;
}

.podium-base {
    width: 100%;
    border-radius: 24px 24px 8px 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding-top: 1.5rem;
    position: relative;
    box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.1);
}

.podium-first { height: 280px; background: linear-gradient(135deg, #FF5C1A, #FF9B42); }
.podium-second { height: 220px; background: linear-gradient(135deg, #64748B, #94A3B8); }
.podium-third { height: 180px; background: linear-gradient(135deg, #9A3412, #C2410C); }
"""

final_lines = new_lines + [correct_css]

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(final_lines)

print("File updated successfully.")
