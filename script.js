let financials = JSON.parse(localStorage.getItem("financials")) || {
total:0,
monthly:0,
limit:0,
remainingLimit:0,
savings:0
};

let expenseData = JSON.parse(localStorage.getItem("expenseData")) || {
Food:0,
Travel:0,
Shopping:0,
"Housing & Utilities":0,
Accessories:0
};

let expenseHistory = JSON.parse(localStorage.getItem("expenseHistory")) || [];

let pendingExtra = 0;
let pendingAmount=0;
let pendingCategory="";
let pendingDate="";

function saveData(){
localStorage.setItem("financials",JSON.stringify(financials));
localStorage.setItem("expenseData",JSON.stringify(expenseData));
localStorage.setItem("expenseHistory",JSON.stringify(expenseHistory));
}

function showSection(sectionId,btn){
document.querySelectorAll(".content").forEach(sec=>sec.style.display="none");
document.getElementById(sectionId).style.display="block";

document.querySelectorAll(".nav-links button").forEach(b=>b.classList.remove("active"));
if(btn) btn.classList.add("active");

if(sectionId==="reports"){
loadHistory();
updateReportChart();
updateInsights();
}
}

function calculateSavings(){
financials.savings = financials.monthly - financials.limit;
if(financials.savings < 0) financials.savings = 0;
}

function updateDashboard(){
document.getElementById("dispTotal").innerText = financials.total;
document.getElementById("dispMonthly").innerText = financials.monthly;
document.getElementById("dispLimit").innerText = financials.remainingLimit;
document.getElementById("dispSavings").innerText = financials.savings;
updateProgressBar();
}

function addExpense(){
let amount = parseFloat(document.getElementById("expenseAmount").value);
let cat = document.getElementById("expenseCategory").value;
let date = document.getElementById("expenseDate").value;

if(isNaN(amount) || amount<=0){ alert("Enter valid amount"); return; }
if(!date){ alert("Select date"); return; }

processExpense(amount,cat,date);
}

function showModal(extra){
pendingExtra = extra;
document.getElementById("warningModal").classList.add("active");
}

function confirmExpense(choice){

document.getElementById("warningModal").classList.remove("active");

if(!choice){
pendingAmount=0;
return;
}

let extra = pendingExtra;

financials.savings -= extra;

if(financials.savings < 0){
financials.total += financials.savings;
financials.savings = 0;
}

financials.monthly -= extra;

expenseData[pendingCategory] += pendingAmount;

expenseHistory.push({
date:pendingDate,
amount:pendingAmount,
cat:pendingCategory,
source:"savings"
});

saveData();
updateDashboard();
updateChart();
updateReportChart();
updateInsights();
loadHistory();
}

function processExpense(amount,cat,date){

let used = Math.min(amount, financials.remainingLimit);
let extra = amount - used;

financials.remainingLimit -= used;
financials.monthly -= used;

if(extra > 0){
pendingAmount = amount;
pendingCategory = cat;
pendingDate = date;
showModal(extra);
return;
}

expenseData[cat] += amount;

expenseHistory.push({
date,
amount,
cat,
source:"limit"
});

saveData();
updateDashboard();
updateChart();
updateReportChart();
updateInsights();
loadHistory();
}

function deleteExpense(index){
let item = expenseHistory[index];

expenseData[item.cat] -= item.amount;

if(item.source === "limit"){
financials.remainingLimit += item.amount;
}
else if(item.source === "savings"){
financials.savings += item.amount;
}

financials.monthly = financials.remainingLimit + financials.savings;

if(financials.remainingLimit > financials.limit){
financials.remainingLimit = financials.limit;
}

expenseHistory.splice(index,1);

saveData();
updateDashboard();
updateChart();
updateReportChart();
updateInsights();
loadHistory();
}

function updateFinancials(){
let t = parseFloat(document.getElementById("inputTotal").value);
let m = parseFloat(document.getElementById("inputMonthly").value);
let l = parseFloat(document.getElementById("inputLimit").value);

if(isNaN(t)||isNaN(m)||isNaN(l)){
alert("Enter all values properly");
return;
}

if(!(t > m && m > l)){
alert("Follow rule: Total Income > Monthly Income > Expense Limit");
return;
}
financials.total = t;
financials.monthly = m;
financials.limit = l;
financials.remainingLimit = l;
financials.savings = m - l;

saveData();
updateDashboard();
updateChart();

alert("Financial details updated successfully");
}

function carryForward(){
financials.total += financials.monthly;

financials.monthly = 0;
financials.limit = 0;
financials.remainingLimit = 0;
financials.savings = 0;

saveData();
updateDashboard();
updateChart();

alert("Next month started");
}

function resetExpenses(){
if(confirm("Reset all expenses?")){
expenseData={Food:0,Travel:0,Shopping:0,"Housing & Utilities":0,Accessories:0};
financials={total:0,monthly:0,limit:0,remainingLimit:0,savings:0};
expenseHistory=[];
saveData();
updateDashboard();
updateChart();
updateReportChart();
updateInsights();
loadHistory();
}
}

/* charts (unchanged) */
function initChart(){
const ctx=document.getElementById("expenseChart").getContext("2d");

window.myChart=new Chart(ctx,{
type:"bar",
data:{
labels:Object.keys(expenseData),
datasets:[
{
label:"Expenses",
data:Object.values(expenseData),
backgroundColor: document.body.classList.contains("dark") ? "#00ff9f" : "#8da399"
}
]
},
options:{
scales:{
x:{
ticks:{ color: document.body.classList.contains("dark") ? "#fff" : "#000" },
grid:{ color: document.body.classList.contains("dark") ? "#444" : "#ccc" }
},
y:{
beginAtZero:true,
max: financials.limit || undefined,
ticks:{ color: document.body.classList.contains("dark") ? "#fff" : "#000" },
grid:{ color: document.body.classList.contains("dark") ? "#444" : "#ccc" }
}
}
}
});
}

function updateChart(){
if(window.myChart){
myChart.data.datasets[0].data = Object.values(expenseData);
myChart.data.datasets[0].backgroundColor =
document.body.classList.contains("dark") ? "#00ff9f" : "#8da399";

myChart.options.scales.y.max = financials.limit || undefined;

myChart.options.scales.x.ticks.color =
document.body.classList.contains("dark") ? "#fff" : "#000";

myChart.options.scales.y.ticks.color =
document.body.classList.contains("dark") ? "#fff" : "#000";

myChart.update();
}
}

function initReportChart(){
const ctx=document.getElementById("reportChart").getContext("2d");

window.reportChart=new Chart(ctx,{
type:"doughnut",
data:{
labels:Object.keys(expenseData),
datasets:[{
data:Object.values(expenseData),
backgroundColor:["#8da399","#9bb7d4","#c5a3ff","#f7b267","#f4845f"]
}]
},
options:{
plugins:{
legend:{
labels:{
color: document.body.classList.contains("dark") ? "#fff" : "#000"
}
}
}
}
});
}

function updateReportChart(){
if(window.reportChart){
reportChart.options.plugins.legend.labels.color =
document.body.classList.contains("dark") ? "#fff" : "#000";
reportChart.update();
}
}

function updateInsights(){
let totalSpent = Object.values(expenseData).reduce((a,b)=>a+b,0);

let highest = Object.keys(expenseData).reduce((a,b)=>
expenseData[a] > expenseData[b] ? a : b
);

let percent = financials.total>0 ?
((totalSpent/financials.total)*100).toFixed(1) : 0;

let box = document.getElementById("insightsBox");

box.innerHTML =
`<p>You spent <b>${percent}%</b> of your income</p>
<p>Highest spending category: <b>${highest}</b></p>`;
}

function loadHistory(){
let container = document.getElementById("historyList");
container.innerHTML="";

expenseHistory.slice().reverse().forEach((item,revIndex)=>{

let originalIndex = expenseHistory.length - 1 - revIndex;

let div=document.createElement("div");
div.className="history-item";

div.innerHTML =
`${item.date} | ${item.cat} | ₹${item.amount}
<span class="delete-btn" onclick="deleteExpense(${originalIndex})">🗑</span>`;

container.appendChild(div);
});
}

function updateProgressBar(){
let percent = (financials.remainingLimit / financials.limit) * 100;
if(isNaN(percent)) percent = 0;

let bar = document.getElementById("progressFill");
if(bar){
bar.style.width = percent + "%";
}
}

function toggleDarkMode(){
document.body.classList.toggle("dark");

let btn = document.getElementById("darkBtn");
if(document.body.classList.contains("dark")){
btn.classList.add("active");
btn.innerText = "Light Mode";
}else{
btn.classList.remove("active");
btn.innerText = "Dark Mode";
}

updateChart();
updateReportChart();
}

window.onload=function(){
document.getElementById("dateDisplay").innerText =
new Date().toDateString();

updateDashboard();
initChart();
initReportChart();
};