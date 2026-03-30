const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRxKJMPU6h5c_asVh6_eAmI3LX3A3cE5yQ7hCRRnSZ-AyW07E8IQuMtI9GHCklvbZ6kUSPY6J8l5zKg/pubhtml' ; // Replace with your CSV URL
let institutions = { universities: [], colleges: [] };
const UPCOMING_DAYS = 30;

// Load Google Sheet CSV
async function loadInstitutions() {
    try {
        const response = await fetch(CSV_URL);
        const csvText = await response.text();
        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                institutions = { universities: [], colleges: [] };
                results.data.forEach(item => {
                    const obj = {
                        name: item.Name,
                        status: item.Status,
                        deadline: item.Deadline
                    };
                    if (item.Type.toLowerCase() === 'university') institutions.universities.push(obj);
                    else if (item.Type.toLowerCase() === 'college') institutions.colleges.push(obj);
                });
                renderGrids();
            }
        });
    } catch (err) {
        console.error('Failed to load institutions CSV:', err);
        document.body.innerHTML += '<p style="color:red;">Failed to load institutions. Check CSV URL.</p>';
    }
}

// Display the next upcoming deadline
function renderNextDeadline() {
    const allInstitutions = [...institutions.universities, ...institutions.colleges];
    const today = new Date();
    
    const upcoming = allInstitutions
        .filter(inst => new Date(inst.deadline) >= today)
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    
    const nextDeadlineDiv = document.getElementById('nextDeadlineCard');
    
    if (upcoming.length === 0) {
        nextDeadlineDiv.innerHTML = "No upcoming deadlines.";
    } else {
        const next = upcoming[0];
        const deadlineDate = new Date(next.deadline);
        const diffTime = deadlineDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        nextDeadlineDiv.innerHTML = `
            <h3>${next.name} (${next.status})</h3>
            <p>Deadline: ${next.deadline} (${diffDays} day${diffDays !== 1 ? 's' : ''} left)</p>
            <p>Type: ${institutions.universities.includes(next) ? 'University' : 'College'}</p>
        `;
    }
}

// Highlight upcoming deadlines
function isUpcoming(deadline) {
    const today = new Date();
    const d = new Date(deadline);
    const diffDays = (d - today)/(1000*60*60*24);
    return diffDays >=0 && diffDays <= UPCOMING_DAYS;
}

// Render grids
function renderGrids(filteredUniversities = null, filteredColleges = null) {
    const uniGrid = document.getElementById('universitiesGrid');
    const colGrid = document.getElementById('collegesGrid');
    uniGrid.innerHTML = '';
    colGrid.innerHTML = '';

    (filteredUniversities || institutions.universities).forEach(u => {
        const card = document.createElement('div');
        card.className = 'card';
        if (isUpcoming(u.deadline)) card.classList.add('upcoming');
        card.innerHTML = `<h3>${u.name}</h3><p>Status: ${u.status}</p><p>Deadline: ${u.deadline}</p>`;
        uniGrid.appendChild(card);
    });

    (filteredColleges || institutions.colleges).forEach(c => {
        const card = document.createElement('div');
        card.className = 'card';
        if (isUpcoming(c.deadline)) card.classList.add('upcoming');
        card.innerHTML = `<h3>${c.name}</h3><p>Status: ${c.status}</p><p>Deadline: ${c.deadline}</p>`;
        colGrid.appendChild(card);
    });

    // Refresh next deadline
    renderNextDeadline();
}

// Apply filters & sorting
function applyFilters() {
    const name = document.getElementById('searchName').value.toLowerCase();
    const status = document.getElementById('filterStatus').value;
    const deadline = document.getElementById('filterDeadline').value;
    const sort = document.getElementById('sortDeadline').value;

    const filteredUniversities = institutions.universities
        .filter(u => (!name || u.name.toLowerCase().includes(name)) &&
                     (!status || u.status === status) &&
                     (!deadline || u.deadline <= deadline))
        .sort((a,b) => sort === 'asc' ? new Date(a.deadline) - new Date(b.deadline) : new Date(b.deadline) - new Date(a.deadline));

    const filteredColleges = institutions.colleges
        .