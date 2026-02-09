
const minList = document.getElementById('min-list');
const secList = document.getElementById('sec-list');
const minInput = document.getElementById('timer-min');
const secInput = document.getElementById('timer-sec');

function populate(list, max) {
    let items = '';
    for (let i = 0; i <= max; i++) {
        items += `<li class="roller-item">${i}</li>`;
    }
    list.innerHTML = items;
}

populate(minList, 999);
populate(secList, 59);

function setupRoller(id, hiddenInput) {
    const roller = document.getElementById(id);
    const itemHeight = 70; // Matches CSS --item-height

    roller.addEventListener('scroll', () => {
        const index = Math.round(roller.scrollTop / itemHeight);
        const items = roller.querySelectorAll('.roller-item');
        
        if(items[index]) {
            items.forEach(item => item.classList.remove('active'));
            items[index].classList.add('active');
            hiddenInput.value = index;
        }
    });

    // Initialize first active
    setTimeout(() => roller.dispatchEvent(new Event('scroll')), 100);
}

setupRoller('min-roller', minInput);
setupRoller('sec-roller', secInput);

function setTimer() {
    console.log(`Saved values: ${minInput.value}m ${secInput.value}s`);
    alert(`Timer set for ${minInput.value} minutes and ${secInput.value} seconds.`);
}

function resetTimer() {
    document.getElementById('min-roller').scrollTo({top: 0, behavior: 'smooth'});
    document.getElementById('sec-roller').scrollTo({top: 0, behavior: 'smooth'});
}
