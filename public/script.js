document.addEventListener('DOMContentLoaded', () => {
    const loader = document.querySelector('.blob-container')
    loader.style.display = "none"
    try {
        if (window.location.pathname.split("/").pop() == "dashboard.html" || window.location.pathname.split("/").pop() == "dashboard") {
            verifyToken();
            loadUsers()
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

const socket = io('https://chatfly.onrender.com')
const stoken = localStorage.getItem('stoken'); 
const allMessages = document.getElementById('all-message'); 
const messageInput = document.getElementById('message'); 
const sendMessageButton = document.getElementById('send-message'); 
let sender = localStorage.getItem('name').split(" ")[0]; 

let rtoken = null; 
socket.emit('user-join', stoken);
socket.on('update-users', (activeUsers) => {
    const userElements = document.querySelectorAll('.user');
    
    userElements.forEach(userElement => {
        const userId = userElement.dataset.userid;

        if (activeUsers.includes(userId)) {
            // If user is active, mark them online
            const statusElement = userElement.querySelector('.status');
            statusElement.textContent = 'Online';
            statusElement.classList.remove('offline');
        } else {
            // If user is not active, mark them offline
            const statusElement = userElement.querySelector('.status');
            statusElement.textContent = 'Offline';
            statusElement.classList.remove('online');
            statusElement.classList.add('offline');
        }
    });
});


socket.on('receive-message', (messageData) => {
    if (messageData.rtoken === stoken && messageData.stoken === rtoken) {
        displayMessage(messageData);
    }
});


sendMessageButton.addEventListener('click', () => {
    const hours = String(new Date().getHours()).padStart(2, "0");
    const minutes = String(new Date().getMinutes()).padStart(2, "0");
    const time = `${hours} : ${minutes}`;
    const messageText = messageInput.value.trim();
    if (messageText === '' || !rtoken) return; 

    const messageData = {
        stoken: stoken, 
        rtoken: rtoken, 
        sender: sender, 
        text: messageText,
        time: time, 
    };

 
    socket.emit('send-message', messageData);
    displayMessage({ ...messageData, sender: 'Me' }); 
    messageInput.value = ''; 
});


function displayMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', message.sender === 'Me' ? 'right' : 'left'); 
    messageDiv.innerHTML = `<p><strong>${message.sender}:</strong> ${message.text}</p>
                             <div class="time">${message.time}</div>`;
    allMessages.appendChild(messageDiv);
    allMessages.scrollTop = allMessages.scrollHeight; 
}


function setReceiver(newReceiverToken) {
    rtoken = newReceiverToken; 
    loadChatHistory(rtoken); 
}


async function loadChatHistory(receiverToken) {
    try {
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
        allMessages.innerHTML = ''; 
        chatHistory.messages.forEach(message => {
            console.log(message)
            if (message.senderId === stoken) {
                displayMessage({ ...message, sender: 'Me' })


            } else {
                displayMessage(message)
            }
        })
    } catch (error) {
        console.error('Error loading chat history:', error);
    }
}







async function loadUsers() {
    try {
        const response = await fetch('https://chatfly.onrender.com/users');
        const users = await response.json(); 

        const userList = document.querySelector('.people-container');
        userList.innerHTML = `<div class="heading">All Chats</div>`; 

        
        users.forEach(user => {
            const userDiv = document.createElement('div');
            userDiv.classList.add('user'); 
            userDiv.setAttribute('data-userId', user._id); 
            userDiv.setAttribute('data-username', user.username); 

            userDiv.innerHTML = `
                <div class="dp">
                    <img src="img/boy.png" alt="user">
                </div>
                <div class="user-info">
                    <p class="username"><strong>${user.username}</strong></p>
                    <p class="status">Don't Know</p>
                </div>
            `;
            userList.appendChild(userDiv); 

            document.querySelectorAll('.user').forEach(user => {
                user.addEventListener('click', (event) => {
                    const userId = event.currentTarget.dataset.userid;
                    document.querySelector('.current-selected-username').textContent = event.currentTarget.dataset.username;
                    setReceiver(userId); 


                });
            })

            





        });
    } catch (error) {
        console.error('Failed to load users:', error);
    }
}




