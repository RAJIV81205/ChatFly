document.addEventListener('DOMContentLoaded' , ()=>{
    const loader = document.querySelector('.blob-container')
    loader.style.display = "none"
})

try {
    document.getElementById('dashboard-button').addEventListener('click',()=>{
        token = localStorage.getItem('token');
        const status = verifyToken(token)
        if(status === "Valid Token"){
            window.location.href = 'dashboard.html';
        }
        else{
            alert("Invalid or Expired Token")
            window.location.href = "login.html"
        }
    })
} catch (error) {
    
}


async function verifyToken(token){
    const response = await fetch ("http://localhost:3000/verify-token",{
        headers:{
            'Content-Type': 'application/json',
        },
        body:JSON.stringify({token})

    })
    const data = await response.json()
    if (response.ok){
        console.log(data)
    }
    else{
        console.error("Error Verifying Token:",error)
    }

}