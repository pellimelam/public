export function loadHero(){

const hero = `

<section class="hero">

<img src="./icons1/logo.png" class="logo" alt="Vidhwaan Logo">

<h1>Vidhwaan Apps</h1>

<p>Register and Get Your Own Mobile App for Just ₹1</p>

<p>Empowering 10,000+ Business Partners with ₹1 Mobile Apps.</p>

<div class="hero-buttons">

<a class="btn btn-primary" href="#registration">
Start Registration
</a>

<a class="btn btn-outline" href="https://vidhwaan.com">
Explore Vidhwaan
</a>

</div>

</section>

`

document.getElementById("hero").innerHTML = hero

}
