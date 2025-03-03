+++
date = "2018-02-23T09:00:00+01:00"
title = "Responsive Design snippets"
tags = ["responsive", "google", "udacity", "nanodegree"]
categories = ["design", "tutorial"]
+++


{{< buymeapizza >}}

## Viewport
```
<head>
[...]
<meta name="viewport" content="width=device-width, initial-scale=1.0">
[...]
</head>
```

## Use small or relative sizes
```
<style type="text/css">
	.logo{
		width: 100px;
	}
	.box{
		width: 100%;
	}
	.hero{
		max-width: 100%;
	}
</style>
```

## Tap/touch targets
* fixed 48px area
```
<style type="text/css">
	nav, a, button {
		min-width: 48px;
		min-height: 48px;
	}
</style>
```

* variable area
```
<style type="text/css">
	nav, a, button {
		padding: 1.5em;
	}
</style>
```


## CSS Media Query

Usage

* CSS Media Query with linked file
```
<link rel="stylesheet" href="style.css">
<link rel="stylesheet" media="screen and (min-width:500px)" href="over500.css">
```

* CSS Media Query embedded
```
<style type="text/css">
	@media screen and (min-width: 500px) {
		body { background-color: green; }
	}
</style>
```

* CSS Media Query imported (avoid for performance reasons)
```
<style type="text/css">
	@import url("over500.css") only screen and (min-width: 500px);
</style>
```

## CSS Media Query with two Breakpoints

```
<style type="text/css">
	body { background-color: green; }

	@media screen and (max-width: 400px) {
		body { background-color: red; }
	}

	@media screen and (min-width: 600px){
		body { background-color: blue; }
	}
</style>
```

## Flexbox - grid based fluid layout

### Usage

* enable flex layout
```
<style type="text/css">
	.container {
		width: 100%;
		display: flex;
	}
	.box { width: 150px; }
</style>
```

* wrap elements instead of shrink
```
<style type="text/css">
	.container {
		width: 100%;
		display: flex;
		flex-wrap: wrap;
	}
	.box { width: 150px; }
</style>
```

* set items order
```
<style type="text/css">
	.red { order: 1; }
	.green { order: 2; }
</style>
```

Example
```
<style type="text/css">
	.container {
		display: flex;
		flex-wrap: wrap;
	}
	.box {
		height: 100px
		text-align: center;
		width: 100%;
	}
	.one { width: 100%; order: 1; }
	.two { width: 50%; order: 2; }
	.three { width: 50%; order: 3; }
</style>
```

## Common Responsive Design Patterns

* Pattern Column Drop

```
<style type="text/css">
	.container {
		display: flex;
		flex-wrap: wrap;
	}
	.box {
		width: 100%;
	}
	@media screen and (min-width: 450px){
		.dark_blue { width: 25%; }
		.light_blue { width: 75%; }
	}
	@media screen and (min-width: 550px){
		.dark_blue, .green { width: 25%; }
		.light_blue { width: 75%; }
	}

</style>

<div class="container">
	<div class="box dark_blue"></div>
	<div class="box light_blue"></div>
	<div class="box green"></div>
</div>
```

* Pattern Mostly Fluid

```
<style type="text/css">
	.container {
		display: flex;
		flex-wrap: wrap;
	}
	.box {
		width: 100%;
	}
	@media screen and (min-width: 450px){
		.light_blue, green { width: 50%; }
	}
	@media screen and (min-width: 550px){
		.dark_blue, .light_blue { width: 50%; }
		.green, .red, .orange { width: 33.333333%; }
	}
	@media screen and (min-width: 700px){
		.container {
			width: 700px
			margin-left: auto;
			margin-right: auto;
		}
	}
</style>

<div class="container">
	<div class="box dark_blue"></div>
	<div class="box light_blue"></div>
	<div class="box green"></div>
	<div class="box red"></div>
	<div class="box orange"></div>
</div>
```

* Pattern Layout Shifter

```
<style type="text/css">
	.container {
		width: 100%;
		display: flex;
		flex-wrap: wrap;
	}
	.box {
		width: 100%;
	}
	@media screen and (min-width: 500px){
		.dark_blue {
			width: 50%;
		}
		#container2 {
			width: 50%;
		}
	}
	@media screen and (min-width: 600px){
		.dark_blue {
			width: 25%;
			order: 1;
		}
		#container2 {
			width: 50%;
		}
		.red {
			width: 25%;
			order: -1;
		}
	}
</style>

<div class="container">
	<div class="box dark_blue"></div>
	<div class="container" id="container2">
		<div class="box light_blue"></div>
		<div class="box green"></div>
	</div>
	<div class="box red"></div>
</div>
```


* Pattern Off Canvas

[Live demo](http://udacity.github.io/RWDF-samples/Lesson4/patterns/off-canvas.html)

```
<style type="text/css">
	html, body, main {
		height: 100%;
		width: 100%;
	}
	nav {
		width: 300px;
		height: 100%;
		position: absolute;
		transform: translate(-300px, 0);
		transition: transform 0.3s ease;
	}
	nav.open {
		transform: translate(0, 0);
	}
	@media screen and (min-width: 600px){
		nav {
			position: relative;
			transform: translate(0, 0);
		}
		body {
			display: flex;
			flex-flow: row nowrap;
		}
		main {
			width: auto;
			flex-grow: 1;
		}
	}
</style>

<script>
menu.addEventListener('click', function(e) {
  drawer.classList.toggle('open');
  e.stopPropagation();
});
</script>

<nav id="drawer" class="dark blue">
</nav>
<main class="light_blue">
</main>
```

## Responsive tables

* Hidden Columns

```
<style type="text/css">
	@media screen and (min-width: 600px){
		.inning {
			display: none;
		}
	}
</style>

<table>
<tr>
<td>Header</td>
<td class="inning">4</td>
<td class="inning">1</td>
<td class="inning">2</td>
<td class="final">7</td>
</tr>
</table>
```

* No more tables

```
<style type="text/css">
	@media screen and (max-width: 500px){
		table, thead, tbody, th, td, tr {
			display: block;
		}
		/* hide table header */
		thead tr {
			position: absolute;
			top: -9999px;
			left: -9999px;
		}
		/* make room for header */
		td {
			position: relative;
			padding-left: 50%;
		}
		/* add row label */
		td:before {
			position: absolute;
			left: 6px;
			content: attr(data-th);
			font-weight: bold;
		}
	}
</style>

<table>
<thead></thead>
<tbody>
<tr>
<td data-th="1st">4</td>
<td data-th="2nd">1</td>
<td data-th="3rd">2</td>
<td data-th="4th">7</td>
</tr>
</tbody>
</table>
```

* Contained tables

```
<style type="text/css">
	div.contained_table {
		width: 100%
		overflow-x: auto;
	}
</style>

<div class="contained_table">
<table>
<thead></thead>
<tbody>
</tbody>
</table>
</div>
```

## Fonts

```
<style type="text/css">
	.smallFonts {
		font-size: 14px;
		line-height: 1.2em;
	}
	.goodFonts {
		font-size: 16px;
		line-height: 1.2em;
	}
	.biggerFonts {
		font-size: 18px;
		line-height: 1.25em;
	}
</style>
```

## Minor Breakpoints

```
<link rel="stylesheet" media="screen and (min-width:550px)" href="over550.css">
<link rel="stylesheet" media="screen and (min-width:700px)" href="over700.css">
<style type="text/css">
	@media screen and (min-width:450px) and (max-width:550px)
	.text {
		display: inline-block;
		width: 30%
	}
	@media screen and (min-width:700px)
	.container {
		width: 700px;
		margin-left:auto;
		margin-right:auto;
		display: block;
	}
</style>
```

## Images

* two images side by side with 10px margin
```
<style type="text/css">
	img {
		max-width:426px;
		width: 50%;
		margin-right: calc((100% - 10px)/2);
	}
	img:last-of-type {
		margin-right: 0;
	}
</style>
```

* three images side by side with 10px margin
```
<style type="text/css">
    body {
      margin: 0px;
    }
	img {
		float: left;
        margin-right: 10px;
        width: calc((100% - 20px)/3);
    }
	img:last-of-type {
		margin-right: 0px;
	}
</style>
```

## Units

* `100vh` = 100% of viewport height
* `100vw`= 100% of viewport width
* `100vmin` = 100% of the smallest between width and height of viewport
* `100vmax` = 100% of the greatest between width and height of viewport


## CSS background

* Elaborate CSS background

```
<style type="text/css">
	body {
		background: 
		linear-gradient(27deg, #151515 5px, transparent 5px) 0 5px,
		linear-gradient(207deg, #151515 5px, transparent 5px) 10 5px,
		linear-gradient(27deg, #222 5px, transparent 5px) 0 10px,
		linear-gradient(207deg, #222 5px, transparent 5px) 10 5px,
		linear-gradient(90deg, #1b1b1b 10px, transparent 10px),
		linear-gradient(#1d1d1d 25%, #1a1a1a 25%, #1a1a1a 50%, transparent 50%, transparent 75%, #242424 75%, #242424);
		background-color: #131313;
		background-size: 20px 20px;
	}
</style>
```

* Responsive background image

```
<style type="text/css">
	body {
		align-items: center;
		display: flex;
		height: 100vh;
		justify-content: center;
	}
	div {
		background-image: url(images/icon1x.png),
		background-image: image-set(url(images/icon1x.png) 1x, url(images/icon2x.png) 2x);
		height: 128px;
		width: 128px;
	}
</style>
```

CSS tag `background-size` ([example](http://udacity.github.io/responsive-images/examples/2-06/backgroundImageConditional/index.html)):
* `cover`: the image is sized so that it is as small as possible while still completely filling its container
* `contain`: the image is sized so that it is as large as possible while still completely filling its container


## Images and Markup

* Unicode (UTF-8) support
```
<meta http-equiv="Content-Type" content="txt/html;charset=utf-8">
```

* icon font (zocial example)
```
<style type="text/css">
	@import url(http://weloveiconfonts.com/api/?family=zocial);
	
	[class*="zocial-"]:before {
		display: inline-block;
		font-family: 'zocial', sans-serif;
		text-shadow: 3px 3px 3px #aaa;
		width: 20vm;
	}
	
	body {
		font-family: 'Roboto Condensed';
		margin: 20vh 0;
	}	
	
	li {
		font-size: 10vw;
		list-style: none;
		margin: 3vw 0;
		padding-left: 100px;
	}
</style>
<body>
	<li class="zocial-twitter">Twitter</li>
```

* inline image with data URI

`<img src="data:image/svg+xml;base64,[data]">`

* Reacting to Device Pixel Ratio
`<img src="image_2x.jpg" srcset="image_2x.jpg 2x, image_1x.jpg 1x" alt="a cool image">`

* Reacting to Image Width
`<img src="image_200.jpg" srcset="image_200.jpg 200w, image_100.jpg 100w" alt="a cool image">`
`<img src="small.jpg" srcset="small.jpg 500w, medium.jpg 1000w, large.jpg 1500w">`

[Example](http://udacity.github.io/responsive-images/examples/srcsetAndSizes/index-quiz1-solution.html)

* srcset with sizes Syntax

```
<img  src="images/great_pic_800.jpg"
      sizes="(max-width: 400px) 100vw, (min-width: 401px) 50vw"
      srcset="images/great_pic_400.jpg 400w, images/great_pic_800.jpg 800w"
      alt="great picture">
```
[Example](http://udacity.github.io/responsive-images/examples/srcsetAndSizes/index-quiz2-solution.html)
```
<style>
	img {
		transition: width 0.5s;
		width: 50vm;
	}
	@media screen and (max-width: 250px) {
		img {
			width: 100vw;
		}
	}
</style>
<img src="small.jpg" srcset="small.jpg 500w, medium.jpg 1000w, large.jpg 1500w" sizes="(max-width: 250px) 100vw, 50vw">
```
* Picturefill polyfill

```
<picture>
  <source
    media="(min-width: 1000px)"
    srcset="kookaburra_large_1x.jpg 1x, kookaburra_large_2x.jpg 2x">
  <source
    media="(min-width: 500px)"
    srcset="kookaburra_medium_1x.jpg 1x, kookaburra_medium_2x.jpg 2x">
  <img src="kookaburra_small.jpg"
    alt="The kookaburra: a terrestrial tree kingfisher native to Australia and New Guinea (according to Wikipedia)">
</picture>
```
[Example](http://udacity.github.io/responsive-images/examples/3-08/picturefill/)


## More resources

* [CSS properties on W3C](https://www.w3.org/community/webed/wiki/CSS/Properties)
* [Viewport on Mozilla Developer Network](https://developer.mozilla.org/en-US/docs/Mozilla/Mobile/Viewport_meta_tag)
* [Responsive Web Design Patterns](https://developers.google.com/web/fundamentals/design-and-ux/responsive/patterns)

{{< buymeapizza >}}
