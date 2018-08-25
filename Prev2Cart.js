class Prev2Cart
{

	constructor( amazonParser )
	{
		this.amazonParser = amazonParser;
	}
	hasError( )
	{
		let x = document.querySelector('#cart-important-message-box h4');
		if( x )
		{
			if( /^Your Update Failed. Please try again/.test( x.textContent.trim() ) )
				return true;
		}

		return false;
	}
}
