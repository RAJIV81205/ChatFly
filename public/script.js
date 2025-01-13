document.addEventListener('DOMContentLoaded', () => {
    const loader = document.querySelector('.blob-container')
    loader.style.display = "none"
    try {
        if (window.location.pathname.split("/").pop() == "dashboard.html" || window.location.pathname.split("/").pop() == "dashboard") {
            verifyToken()
        }

    } catch (error) {
        console.error(error)

    }
})



async function verifyToken() {
    const token = localStorage.getItem('token')
    if (!token) {
        console.log("No Token")
        window.location.href = "login.html"
        return
    }
    const response = await fetch("https://chatfly.onrender.com/verify", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token })

    })
    const data = await response.json()
    if (response.ok) {
        console.log(data.message);
        console.log(data.result.id)
        localStorage.setItem("stoken", data.result.id)

        const at = new Date(data.result.iat * 1000);
        const exp = new Date(data.result.exp * 1000);
        console.log(at.toLocaleString());
        console.log(exp.toLocaleString());

        const exptime = exp;
        const current = new Date();
        console.log(exptime, current)

        if (exptime < current) {
            localStorage.removeItem('token')
            window.location.href = "login.html"
        }
        else {
            //updateMessages(data.result.id);

        }

    }
}

try {
    document.getElementById('dashboard-button').addEventListener('click', () => {
        window.location.href = "dashboard.html"
    })
} catch (error) {
    console.error(error)
}



try {
    document.getElementById('select-signup-btn').addEventListener('click', () => {
        document.querySelector('.selected-btn').style.transform = "translateX(100%)"

        const container = document.getElementById("form-container");
        container.innerHTML = '';
        container.innerHTML = `
                <div class="input-wrapper signup-wrapper">
                    <input type="text" id="signup-name" name="name" placeholder=" " required>
                    <label for="name">Name</label>
                    <img src="img/user.png" alt="name">

                </div>

                <div class="input-wrapper signup-wrapper">
                    <input type="number" id="signup-mobile" name="mobile" placeholder=" " required>
                    <label for="mobile">Mobile</label>
                    <img src="img/phone.png" alt="mobile">

                </div>

                <div class="input-wrapper signup-wrapper">
                    <input type="email" id="signup-email" name="email" placeholder=" " required>
                    <label for="email">Email</label>
                    <img src="img/email.png" alt="email">

                </div>

                <div class="input-wrapper signup-wrapper">
                    <input type="password" id="signup-password" name="password" placeholder=" " required>
                    <label for="password">Password</label>
                    <img src="img/key.png" alt="password">
                </div>

                <button id="signup-btn">Signup</button>

`;



        document.getElementById('signup-btn').addEventListener('click', () => {
            signupUser()
        })
    })
} catch (error) {
    console.error("signup error");

}



async function signupUser() {
    const username = document.getElementById('signup-name').value.trim();
    const mobile = document.getElementById('signup-mobile').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value.trim();
    const time = new Date().toLocaleString();


    if (!username || !mobile || !email || !password) {
        alert("Please fill all the fields.");
        return;
    }

    try {
        const response = await fetch('https://chatfly.onrender.com/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                mobile: mobile,
                email: email,
                password: password,
                time: time,
            }),
        });


        if (response.ok) {
            const data = await response.json();
            console.log("Signup Successful:", data);
            alert("Signup Successful!");
            window.location.href = "login.html"
        } else {

            const errorData = await response.json();
            console.error("Error:", errorData.message || "Something went wrong.");
            alert(`Error: ${errorData.message || "Signup failed."}`);
        }
    } catch (error) {

        console.error("Fetch Error:", error);
        alert("Error: Unable to signup. Please try again later.");
    }
}















try {
    document.getElementById('select-login-btn').addEventListener('click', () => {
        document.querySelector('.selected-btn').style.transform = "translateX(0%)"

        const container = document.getElementById("form-container");
        container.innerHTML = '';
        container.innerHTML = `
        <div class="input-wrapper">
                    <input type="email" id="login-email" name="email" placeholder=" " required>
                    <label for="email">Email</label>
                    <img src="img/email.png" alt="email">

                </div>
                <div class="forgot"><a href="#">Forgot Password ?</a></div>
                <div class="input-wrapper">
                    <input type="password" id="login-password" name="password" placeholder=" " required>
                    <label for="password">Password</label>
                    <img src="img/key.png" alt="password">
                </div>
                <button id="login-btn">Login</button>

                
`

        document.getElementById('login-btn').addEventListener('click', () => {
            loginUser()
        })
    })


} catch (error) {
    console.error(error)

}

try {
    document.getElementById('login-btn').addEventListener('click', () => {
        loginUser()
    })

} catch (error) {
    console.error(error)
}





async function loginUser() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        alert("Please fill the details")
        return;
    }

    try {
        const response = await fetch('https://chatfly.onrender.com/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password
            })

        })

        const data = await response.json()

        if (response.ok) {
            console.log(data)
            localStorage.setItem('token', data.token)
            localStorage.setItem('name', data.user.name)
            window.location.href = 'dashboard.html'
        }
        else {
            alert("Invalid credentials")
            console.error("Error:", data.message)
        }
    } catch (error) {
        console.error(error)
    }

}

const socket = io('https://chatfly.onrender.com'); // Connect to your server
const stoken = localStorage.getItem('stoken'); // Sender's token
const allMessages = document.getElementById('all-message'); // Chat window
const messageInput = document.getElementById('message'); // Message input field
const sendMessageButton = document.getElementById('send-message'); // Send button
let sender = localStorage.getItem('name').split(" ")[0]; // Extract sender's name
const hours = String(new Date().getHours()).padStart(2, "0");
const minutes = String(new Date().getMinutes()).padStart(2, "0");
const time = `${hours} : ${minutes}`;
let rtoken = null; // Selected receiver token

// Listen for incoming messages
socket.on('receive-message', (messageData) => {
    // Only display messages sent to this user by the current receiver
    if (messageData.rtoken === stoken && messageData.stoken === rtoken) {
        displayMessage(messageData);
    }
});

// Send a message
sendMessageButton.addEventListener('click', () => {
    const messageText = messageInput.value.trim();
    if (messageText === '' || !rtoken) return; // Ensure message text and receiver exist

    const messageData = {
        stoken: stoken, // Sender's token
        rtoken: rtoken, // Receiver's token
        sender: sender, // Sender's name
        text: messageText,
        time: time, // Current time
    };

    // Emit the message to the server
    socket.emit('send-message', messageData);
    displayMessage({ ...messageData, sender: 'Me' }); // Display message on sender's screen
    messageInput.value = ''; // Clear the input field
});

// Display a message in the chat window
function displayMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', message.sender === 'Me' ? 'right' : 'left'); // Align message
    messageDiv.innerHTML = `<p><strong>${message.sender}:</strong> ${message.text}</p>
                             <div class="time">${message.time}</div>`;
    allMessages.appendChild(messageDiv);
    allMessages.scrollTop = allMessages.scrollHeight; // Scroll to the latest message
}

// Set the current receiver
function setReceiver(newReceiverToken) {
    rtoken = newReceiverToken; // Update receiver token
    loadChatHistory(rtoken); // Load chat history with this receiver
}

// Load chat history with the selected receiver
async function loadChatHistory(receiverToken) {
    try {
        // Fetch chat history from the backend
        const response = await fetch('https://chatfly.onrender.com/load-history', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user1: stoken,
                user2: receiverToken,
            }),
        });

        if (!response.ok) {
            console.error('Failed to fetch chat history');
            return;
        }

        const chatHistory = await response.json();
        allMessages.innerHTML = ''; // Clear the chat window
        chatHistory.messages.forEach(message => {
            console.log(message)
            if (message.senderId === stoken) {
                displayMessage({...message , sender:'Me'})


            }else{
                displayMessage(message)
            }
        })
    }catch (error) {
                console.error('Error loading chat history:', error);
            }
        }
    

// Add event listeners to user list items for selecting a receiver
try {

            document.querySelectorAll('.user').forEach(user => {
                user.addEventListener('click', (event) => {
                    const userId = event.currentTarget.dataset.userid;
                    document.querySelector('.current-selected-username').textContent = event.currentTarget.dataset.username;
                    setReceiver(userId); // Set the selected user's token
                    

                });
            })

        } catch (error) {
            console.error("Error attaching click event to user list:", error);
        }
