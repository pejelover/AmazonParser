export default class Prev2Cart
{

	constructor( amazonParser )
	{
		this.amazonParser = amazonParser;
	}

	hasError( )
	{
		let x = document.querySelector('#cart-important-message-box .a-alert-warning p');

		if( x )
		{
			//Your Update Failed. Please try again.
			if( /^Your Update Failed. Please try again/.test( x.textContent.trim() ) )
				return true;
		}

		return false;
	}
}
