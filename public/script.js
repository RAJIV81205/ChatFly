document.addEventListener('DOMContentLoaded', () => {
    const loader = document.querySelector('.blob-container')
    loader.style.display = "none"
})

try {
    document.getElementById('dashboard-button').addEventListener('click', () => {
        token = localStorage.getItem('token');
        const status = verifyToken(token)
        if (status === "Valid Token") {
            window.location.href = 'dashboard.html';
        }
        else {
            alert("Invalid or Expired Token")
            window.location.href = "login.html"
        }
    })
} catch (error) {

}


async function verifyToken(token) {
    const response = await fetch("http://localhost:3000/verify-token", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token })

    })
    const data = await response.json()
    if (response.ok) {
        console.log(data)
    }
    else {
        console.error("Error Verifying Token:", error)
    }

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
        const response = await fetch('http://localhost:3000/signup', {
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
            window.location.href="login.html"
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


function loginUser() {
    alert('working')
}
