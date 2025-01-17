document.addEventListener('DOMContentLoaded', async () => {
    const loader = document.querySelector('.blob-container')
    loader.style.display = "none"
    try {
        if (window.location.pathname.split("/").pop() == "dashboard.html" || window.location.pathname.split("/").pop() == "dashboard") {
            verifyToken();
            loadUsers();
            loadProfile();
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
            localStorage.clear()
            window.location.href = "login.html"
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
                    <select id="signup-gender" name="gender" required>
                    <option value="" disabled selected></option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                 </select>
                <label for="signup-gender">Gender</label>
                <img src="img/gender-fluid.png" alt="gender">
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

function inputcheck() {
    const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.onmouseenter = Swal.stopTimer;
            toast.onmouseleave = Swal.resumeTimer;
        }
    });
    Toast.fire({
        icon: "error",
        title: "Please fill in all the fields"
    });
}



async function signupUser() {
    const username = document.getElementById('signup-name').value.trim();
    const mobile = document.getElementById('signup-mobile').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value.trim();
    const gender = document.getElementById("signup-gender").value
    let time = new Date().toLocaleString();
    const displayName = await getDisplayName(gender);


    if (!username || !mobile || !email || !password || !gender || !displayName) {
        inputcheck();
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
                displayName: displayName,
                gender: gender,
                mobile: mobile,
                email: email,
                password: password,
                time: time,
            }),
        });


        if (response.ok) {
            const data = await response.json();
            console.log("Signup Successful:", data);
            Swal.fire({
                title: 'Signup Successful!',
                text: `Your Display Name is ${displayName}`,
                icon: 'success',
                showConfirmButton: true,
                confirmButtonText: 'Login',
                timer: 3000,
                timerProgressBar: true,
                customClass: {
                    popup: 'custom-swal-popup',
                    title: 'custom-swal-title',
                    confirmButton: 'custom-swal-button',
                    timerProgressBar: 'custom-swal-timer-bar',
                },
            }).then((result) => {
                if (result.isConfirmed || result.dismiss === Swal.DismissReason.timer) {
                    window.location.href = 'login.html';
                }
            });
        } else {

            const errorData = await response.json();
            console.error("Error:", errorData.message || "Something went wrong.");
            mess = "Error:", errorData.message || "Something went wrong."
            notify(mess);

        }
    }

    catch (error) {

        console.error("Fetch Error:", error);
        mess = "Error: Unable to signup. Please try again later.";
        notify(mess)
    }
}





async function getDisplayName(gender) {
    try {
        const response = await fetch(`https://randomuser.me/api/?gender=${gender}&inc=name&nat=us,dk,fr,gb`);
        const data = await response.json();
        const fname = data.results[0].name.first;
        const lname = data.results[0].name.last;

        return fname + " " + lname;
    } catch (error) {
        console.error('Error in fetching display Name:', error);
        return null;
    }
}





function notify(mess) {
    const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.onmouseenter = Swal.stopTimer;
            toast.onmouseleave = Swal.resumeTimer;
        }
    });
    Toast.fire({
        icon: "error",
        title: `${mess}`
    }).then((result) => {
        if (result.isConfirmed || result.dismiss === Swal.DismissReason.timer) {
            window.location.href = 'login.html';
        }
    })
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
        inputcheck()
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
            localStorage.setItem('name', data.user.displayName)


            Swal.fire({
                title: 'Login Successful!',
                text: `Welcome Back! ${data.user.name}.`,
                icon: 'success',
                showConfirmButton: true,
                confirmButtonText: 'Start Chatting',
                timer: 3000,
                timerProgressBar: true,
                customClass: {
                    text: 'custom-swal-title',
                    popup: 'custom-swal-popup',
                    title: 'custom-swal-title',
                    confirmButton: 'custom-swal-button',
                    timerProgressBar: 'custom-swal-timer-bar',
                },
            }).then((result) => {

                if (result.isConfirmed || result.dismiss === Swal.DismissReason.timer) {
                    window.location.href = "dashboard.html";

                }
            });



        }
        else {
            mess = "Invalid credentials"
            notify(mess)
            console.error("Error:", data.message)
        }
    } catch (error) {
        console.error(error)
    }

}



const socket = io('https://chatfly.onrender.com', {
    reconnectionDelayMax: 10000,
    reconnection: true,
    reconnectionAttempts: 10,
    transports: ['websocket', 'polling'],
    secure: true,
    rejectUnauthorized: false,
    path: '/socket.io/',
    withCredentials: true
});


socket.on('connect', () => {
    console.log('Successfully connected to server');
});

socket.on('connect_error', (error) => {
    console.error('Connection Error:', error);
    if (socket.io.opts.transports.includes('websocket')) {
        console.log('Falling back to polling transport');
        socket.io.opts.transports = ['polling'];
    }
});

socket.on('disconnect', (reason) => {
    console.log('Disconnected:', reason);
    if (reason === 'io server disconnect') {
        socket.connect();
    }
});

const stoken = localStorage.getItem('stoken');
socket.emit('user-join', stoken);


const allMessages = document.getElementById('all-message');
const messageInput = document.getElementById('message');
const sendMessageButton = document.getElementById('send-message');
let sender = localStorage.getItem('name').split(" ")[0];

let rtoken = null;

setInterval(() => {
    socket.emit('check-status');
}, 1000);
socket.on('update-users', (activeUsers) => {
    const userElements = document.querySelectorAll('.user');

    userElements.forEach(userElement => {
        const userId = userElement.dataset.userid;

        if (activeUsers.includes(userId)) {
            userElement.style.backgroundColor = "#52f65b"
            const statusElement = userElement.querySelector('.status');
            statusElement.textContent = 'Online';
            statusElement.classList.remove('offline');
        } else {
            userElement.style.backgroundColor = "#e6e6e6"
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
        userList.innerHTML = `<div class="heading"><img src="img/profile-user.png" id="profile-img" alt="dp">All Chats <img src="img/exit.png" alt="exit" id="log-out"></div>`;

        const userid = localStorage.getItem('stoken')

        users.forEach(user => {


            if (userid === user._id) {
                return;
            }
            const userDiv = document.createElement('div')
            userDiv.classList.add('user');
            userDiv.setAttribute('data-userId', user._id)
            userDiv.setAttribute('data-username', user.displayName)

            userDiv.innerHTML = `
                <div class="dp">
                    <img src="img/boy.png" alt="user">
                </div>
                <div class="user-info">
                    <p class="username"><strong>${user.displayName}</strong></p>
                    <p class="status">Don't Know</p>
                </div>
            `;
            userList.appendChild(userDiv);

            document.querySelectorAll('.user').forEach(user => {
                user.addEventListener('click', (event) => {
                    const userId = event.currentTarget.dataset.userid;
                    document.querySelector('.current-selected-username').textContent = event.currentTarget.dataset.username
                    setReceiver(userId);
                    window.location.href = "#message-container";
                    document.getElementById('message').disabled = false


                });
            });

















        });

        document.getElementById("log-out").addEventListener('click', () => {
            localStorage.clear();
            mess = "Logging Out...."
            notify(mess)
        })


        const profile = document.querySelector(".profile-section");
        const profileImg = document.getElementById("profile-img");

        if (!profile || !profileImg) {
            throw new Error("Either '.profile-section' or '#profile-img' element is missing.");
        }

        profileImg.addEventListener('click', () => {
            profile.classList.toggle("active");
        });

    } catch (error) {
        console.error('Failed to load users:', error);
    }
}







async function loadProfile() {
    const userid = localStorage.getItem('stoken');
    const response = await fetch('https://chatfly.onrender.com/load-profile', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            userid: userid,
        }),
    });

    if (!response.ok) {
        console.error('Failed to fetch profile');
        return;
    }

    const profile = await response.json();

    document.getElementById("profile-name").textContent = profile.user.displayName
    document.getElementById("profile-username").textContent = profile.user.username;
    document.getElementById("profile-mobile").textContent = profile.user.mobile;
    document.getElementById("profile-displayName").textContent = profile.user.displayName;
    document.getElementById("profile-gender").textContent = profile.user.gender;
    document.getElementById("profile-email").textContent = profile.user.email;
    document.getElementById("profile-time").textContent = profile.user.time;




    const profileElements = {
        username: document.getElementById('profile-username'),
        mobile: document.getElementById('profile-mobile'),
        displayName: document.getElementById('profile-displayName'),
        gender: document.getElementById('profile-gender'),
        email: document.getElementById('profile-email'),
        time: document.getElementById('profile-time'),
    };

    const editButton = document.getElementById('edit-button');

    let isEditing = false;

    editButton.addEventListener('click', async () => {
        if (!isEditing) {
            for (let key in profileElements) {
                if (key !== 'time' && key !== 'gender' && key !== 'displayName') {
                    profileElements[key].setAttribute('contenteditable', 'true');
                    profileElements[key].classList.add('editable');
                }
            }
            editButton.textContent = 'Submit';
        } else {
            const updatedData = {
                username: profileElements.username.textContent.trim(),
                mobile: profileElements.mobile.textContent.trim(),
                displayName: profileElements.displayName.textContent.trim(),
                email: profileElements.email.textContent.trim(),
                time: new Date().toLocaleString(),
            };

            try {


                const response = await updateProfileInDatabase(userid, updatedData);

                if (response.success) {
                    profileElements.time.textContent = updatedData.time;
                    for (let key in profileElements) {
                        profileElements[key].setAttribute('contenteditable', 'false');
                        profileElements[key].classList.remove('editable');
                    }
                    editButton.textContent = 'Edit Profile';
                    const Toast = Swal.mixin({
                        toast: true,
                        position: "top-end",
                        showConfirmButton: false,
                        timer: 3000,
                        timerProgressBar: true,
                        didOpen: (toast) => {
                            toast.onmouseenter = Swal.stopTimer;
                            toast.onmouseleave = Swal.resumeTimer;
                        }
                    });
                    Toast.fire({
                        icon: "success",
                        title: `Your Profile has Been Updated`
                    }).then((result) => {
                        if (result.isConfirmed || result.dismiss === Swal.DismissReason.timer) {
                            location.reload()
                        }
                    })
                } else {
                    throw new Error(response.message);
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                alert('Failed to save changes. Please try again.');
            }
        }

        isEditing = !isEditing;
    });

}


async function updateProfileInDatabase(userid, data) {
    const backendUrl = 'https://chatfly.onrender.com/updateProfile';

    const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: userid, ...data }),
    });

    return response.json();
}