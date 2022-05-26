const generatorEl          = document.getElementById('password-generator');
const resultEl             = document.getElementById('result');
const lengthSliderEl       = document.getElementById('length-slider');
const lengthDispEl         = document.getElementById('length-display');
const uppercaseEl          = document.getElementById('uppercase');
const lowercaseEl          = document.getElementById('lowercase');
const numbersEl            = document.getElementById('numbers');
const symbolsEl            = document.getElementById('symbols');
const usePassEl            = document.getElementById('use-password');
const editorPassEl         = document.getElementById("editor-password-input");
const creatorPassEl        = document.getElementById("creator-password-input");
const cancelPassEl         = document.getElementById("cancel-password");
const generateEl           = document.getElementById('generate');
const creatorOpenPassGenEl = document.getElementById('creator-generate-svg');
const editorOpenPassGenEl  = document.getElementById('editor-generate-svg');

//set event listeners
lengthSliderEl.addEventListener("input", () => {
    lengthDispEl.value = lengthSliderEl.value;
});
creatorOpenPassGenEl.addEventListener("click", openGen);
editorOpenPassGenEl.addEventListener("click", openGen);
usePassEl.addEventListener("click", useGenPass);
cancelPassEl.addEventListener("click", closeGen);
generateEl.addEventListener('click', genPass);

//open the password generator
function openGen() {
    generatorEl.style.display = "initial"
}

//close generator
function closeGen() {
    if (openedClumpId === -1) popupState = 1
    else popupState = 2
    resultEl.innerText = "";
    lengthSliderEl.value = "20";
    lengthDispEl.value = "20";
    generatorEl.style.display = "none";
}

//use the generated password and set the text of the relevant menu
function useGenPass() {
    if (resultEl.innerText === "") return; //return if password not generated
    if (popupState === 1) {
        if (creatorToggleViewPassEl.firstChild.href.baseVal === "#viewPassword-symbol") hideCreatorPass();
        creatorPassEl.value = resultEl.innerText;
    } else {
        if (editorToggleViewPassEl.firstChild.href.baseVal === "#viewPassword-symbol") hideEditorPass();
        editorPassEl.value = resultEl.innerText;
    }
    closeGen();
}

//generate the password
function genPass() {
    const randomFunc = {
        lower: getRandomLower,
        upper: getRandomUpper,
        number: getRandomNumber,
        symbol: getRandomSymbol
    };

    const length = +lengthSliderEl.value;
    const lower = lowercaseEl.checked;
    const upper = uppercaseEl.checked;
    const number = numbersEl.checked;
    const symbol = symbolsEl.checked;

    let generatedPassword = '';
    const typesCount = lower + upper + number + symbol;
    const typesArr = [{lower}, {upper}, {number}, {symbol}].filter(item => Object.values(item)[0]);

    if(typesCount === 0) {
        return '';
    }

    for(let i=0; i<length; i+=typesCount) {
        typesArr.forEach(type => {
            const funcName = Object.keys(type)[0];
            generatedPassword += randomFunc[funcName]();
        });
    }

    const finalPassword = generatedPassword.slice(0, length);
    resultEl.innerText = finalPassword;
}

function getRandomLower() {
    return String.fromCharCode(Math.floor(Math.random() * 26) + 97);
}
function getRandomUpper() {
    return String.fromCharCode(Math.floor(Math.random() * 26) + 65);
}
function getRandomNumber() {
    return +String.fromCharCode(Math.floor(Math.random() * 10) + 48);
}
function getRandomSymbol() {
    const symbols = '!@#$%^&*(){}[]=<>/,.'
    return symbols[Math.floor(Math.random() * symbols.length)];
}
