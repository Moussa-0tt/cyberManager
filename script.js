
let stations = [];
let historique = [];
let clientCounter = 0;


//  Recuperation des elements 


const btnStationRun = document.getElementById('btnStationRun');
const btnHistorique = document.getElementById('btnHistorique');
const stationRunSection = document.getElementById('stationRunSection');
const historiqueSection = document.getElementById('historiqueSection');
const btnAjouterStation = document.getElementById('btnAjouterStation');
const btnStopAll = document.getElementById('btnStopAll');
const formContainer = document.getElementById('formContainer');
const stationsContainer = document.getElementById('stationsContainer');
const codeAccesInput = document.getElementById('codeAcces');
const btnValiderCode = document.getElementById('btnValiderCode');
const historiqueContainer = document.getElementById('historiqueContainer');
const historiqueTableBody = document.querySelector('#historiqueTable tbody');
const filterType = document.getElementById('filterType');
const alertSound = document.getElementById('alertSound');



// Navigation
btnStationRun.onclick = () => {
    stationRunSection.style.display = 'block';
    historiqueSection.style.display = 'none';
};
btnHistorique.onclick = () => {
    stationRunSection.style.display = 'none';
    historiqueSection.style.display = 'block';
};



// Ajouter formulaire
btnAjouterStation.onclick = () => {
    const form = document.createElement('div');
    form.classList.add('station-form');
    form.innerHTML = `
        <h3>Nouvelle Station</h3>
        <input type="text" placeholder="Numéro de la station" class="inputNumero"><br>
        <select class="inputType">
            <option value="">Choisir type</option>
            <option value="PC">PC</option>
            <option value="PS4">PS4</option>
            <option value="PS3">PS3</option>
        </select><br>
        <div class="times">
            <input type="number" placeholder="Heures" class="inputHeures" min="0" max="23">
            <input type="number" placeholder="Minutes" class="inputMinutes" min="0" max="59">
            <input type="number" placeholder="Secondes" class="inputSecondes" min="0" max="59">
        </div>
        <input type="number" placeholder="Prix (FCFA)" class="inputPrix"><br>
        <button class="btnValider">Valider</button>
    `;
    formContainer.appendChild(form);

    form.querySelector('.btnValider').onclick = () => {
        const numero = form.querySelector('.inputNumero').value.trim();
        const type = form.querySelector('.inputType').value;
        const heures = parseInt(form.querySelector('.inputHeures').value) || 0;
        const minutes = parseInt(form.querySelector('.inputMinutes').value) || 0;
        const secondes = parseInt(form.querySelector('.inputSecondes').value) || 0;
        const prix = parseInt(form.querySelector('.inputPrix').value.trim());

        if(!numero || !type || prix<=0 || (heures+minutes+secondes)<=0){
            alert("Veuillez remplir correctement tous les champs !");
            return;
        }

        if(stations.some(s => s.numero === numero)){
            alert("Cette station est déjà active.");
            return;
        }

        const totalSecondes = heures*3600 + minutes*60 + secondes;
        const station = {numero, type, totalSecondes, prix, statut:'active', interval:null};
        stations.push(station);
        afficherStation(station);
        form.remove();
    };
};

// Convertir secondes en hh:mm:ss
function formatTime(sec){
    const h = Math.floor(sec/3600).toString().padStart(2,'0');
    const m = Math.floor((sec%3600)/60).toString().padStart(2,'0');
    const s = (sec%60).toString().padStart(2,'0');
    return `${h}:${m}:${s}`;
}

// Afficher carte station
function afficherStation(station){
    const card = document.createElement('div');
    card.classList.add('station-card');
    card.id = `station-${station.numero}`;
    card.innerHTML = `
        <h4>Station ${station.numero} (${station.type})</h4>
        <p>Temps restant: <span class="timer">${formatTime(station.totalSecondes)}</span></p>
        <p>Prix: ${station.prix} FCFA</p>
        <button class="btnStart">Start</button>
        <button class="btnPause">Pause</button>
        <button class="btnReset">Reset</button>
        <button class="btnAjouterTemps">+Temps</button>
        <button class="btnSupprimer">Supprimer</button>
    `;
    stationsContainer.appendChild(card);

    let timeLeft = station.totalSecondes;
    let timerEl = card.querySelector('.timer');
    let running=false;


    // upload timer color

    function updateTimer(){
        timerEl.textContent = formatTime(timeLeft);
        const ratio = timeLeft/station.totalSecondes;
        if(ratio>0.5) timerEl.style.color="limegreen";
        else if(ratio>0.2) timerEl.style.color="orange";
        else timerEl.style.color="red";
    }

    // Fonction pour ajouter du temps
    function ajouterTemps() {
        let minutesAjoutees = parseInt(prompt("Entrez le nombre de minutes à ajouter :")) || 0;
        let prixAjouter = parseInt(prompt("Entrez le prix du temps")) || 0;
        if (minutesAjoutees > 0) {
            timeLeft += minutesAjoutees * 60; // en secondes
            
            // Ne pas modifier station.totalSecondes ici, sinon le ratio de couleur sera faussé
            updateTimer();
            alert(`${minutesAjoutees} minutes ajoutées à la station ${station.numero}`);
        }
    }


    function startTimer(){
        if(running) return;
        running=true;
        station.interval = setInterval(()=>{
            timeLeft--;
            updateTimer();
            if(timeLeft<=0){
                clearInterval(station.interval);
                running=false;

                alertSound.play();
                setTimeout(() =>{
                    alertSound.pause();
                    alertSound.currentTime = 0;
                }, 2000);

                alert(`Le temps de la station ${station.numero} est terminé !`);
                station.statut='terminé';
                ajouterHistorique(station);
            }
        },1000);
    }

    card.querySelector('.btnStart').onclick=startTimer;
    card.querySelector('.btnPause').onclick=()=>{clearInterval(station.interval); running=false;};
    card.querySelector('.btnReset').onclick=()=>{
        clearInterval(station.interval);
        running=false;
        timeLeft=station.totalSecondes;
        updateTimer();
    };
    card.querySelector('.btnSupprimer').onclick=()=>{
        clearInterval(station.interval);
        stations=stations.filter(s=>s.numero!==station.numero);
        card.remove();
    };
    card.querySelector('.btnAjouterTemps').addEventListener('click', () => {
    ajouterTemps();
});

}

// Stop all timers
btnStopAll.onclick=()=>{
    stations.forEach(s=>clearInterval(s.interval));
    stations.forEach(s=>s.interval=null);
};

// Ajouter à l'historique
function ajouterHistorique(station){
    clientCounter++;
    const date=new Date();
    const heureAchat=date.toLocaleString();
    const row=document.createElement('tr');
    row.dataset.type=station.type;
    row.innerHTML=`
        <td>${clientCounter}</td>
        <td>${station.numero}</td>
        <td>${station.type}</td>
        <td>${formatTime(station.totalSecondes)}</td>
        <td>${station.prix}</td>
        <td>${heureAchat}</td>
    `;
    historiqueTableBody.appendChild(row);
}

// Historique
btnValiderCode.onclick=()=>{
    if(codeAccesInput.value==='1234'){
        historiqueContainer.style.display='block';
    } else {
        alert("Code incorrect !");
    }
};

// Filtrer par type
filterType.onchange=()=>{
    const type=filterType.value;
    Array.from(historiqueTableBody.children).forEach(row=>{
        row.style.display=(type==="" || row.dataset.type===type) ? "" : "none";
    });
};

const btnDownloadCSV = document.createElement('button');
btnDownloadCSV.textContent = "Télécharger l'historique (CSV)";
btnDownloadCSV.style.margin = "10px";
historiqueContainer.insertBefore(btnDownloadCSV, historiqueContainer.firstChild);

btnDownloadCSV.onclick = () => {
    let csv = "N° Client,Numéro Station,Type,Durée,Prix,Heure Achat\n";
    Array.from(historiqueTableBody.children).forEach(row => {
        const cells = Array.from(row.children).map(td => `"${td.textContent.replace(/"/g, '""')}"`);
        csv += cells.join(",") + "\n";
    });
    const blob = new Blob([csv], {type: "text/csv"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "historique.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};