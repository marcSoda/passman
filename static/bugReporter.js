const bugReporterEl = document.getElementById('bugReporter');

function openBugReporter() {
    extendShade();
    bugReporterEl.style.display = "initial";
    popupState = 5;
}

document.getElementById("bugClose").addEventListener('click', closeBugReporter);
function closeBugReporter() {
    retractShade();
    document.getElementById("bugText").value = "";
    bugReporterEl.style.display = "none";
}

document.getElementById("bugSubmit").addEventListener("click", submitBug);
function submitBug() {
    console.log("submitting bug")
    var bug = document.getElementById("bugText").value;
    let url = '/bug';
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            bug: bug
        })
    }).then(res => {
        if (res.ok) {
            console.log("successful bug submission");
            closeBugReporter();
        } else {
            console.log("unsuccessful bug submission");
        }
    }).catch(err => {
        console.log("error submitting bug");
        ping();
    })
}
