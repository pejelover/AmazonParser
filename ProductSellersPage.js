class ProductSellersPage
{
	constructor(amazonParser, productUtils )
	{
		this.amazonParser = amazonParser;
		this.productUtils = productUtils;
	}

	addToCartBySellerId( seller_id )
	{
		let searchSeller = seller_id === 'ATVPDKIKX0DER' ? 'amazon.com' : seller_id;

		let product = this.getProduct();
		let offer	= product.offers.find( offer => 'seller_id' in offer && offer.seller_id == searchSeller );

		if( offer !== undefined && 'add2CarSelector' in offer )
		{
			let ele = document.querySelector( offer.add2CarSelector );
			if( ele )
				ele.click();
			else
				console.log('Looking for '+seller_id );
		}
		else
		{
			console.log('Looking for '+seller_id );
		}
	}

	addToCartFirstSeller()
	{
		try{
			let divs = document.querySelector('#olpOfferList div[role="row"].olpOffer input[value="Add to cart"]').click();
		}
		catch(e)
		{
			console.error('SellersPage: Selector to add cart Fails');
		}
	}

	getProduct()
	{
		let product	= this.productUtils.createNewProductObject();

		let name = document.querySelector('#olpProductDetails h1');

		if( name )
			product.title = name.textContent.trim();

		let producer = document.querySelector('#olpProductByline');

		if( producer && /^by /.test( producer.textContent.trim() ) )
			product.producer = producer.textContent.trim().replace(/^by /,'').toLowerCase();

		product.asin		= this.amazonParser.getAsinFromUrl( window.location.href );

		let divs = document.querySelectorAll('#olpOfferList div[role="row"].olpOffer');
		let da	= Array.from( divs );

		da.forEach((div)=>
		{
			let seller = div.querySelector('.olpSellerName span>a,.olpSellerName img[alt="Amazon.com"]');

			if( seller )
			{

				let input = div.querySelector('input[type="submit"]');
				let attr = input.getAttribute('aria-labelledby');

				if( attr == null )
					console.log("IS NULL", input );

				let isAmazon = seller.tagName == 'IMG' && seller.getAttribute("alt") === 'Amazon.com';

				let selector = 'input[type="submit"][aria-labelledby="'+attr+'"]';
				let sellerName = isAmazon ? 'amazon.com' : seller.textContent;
				let seller_url	= seller.tagName === 'IMG' ? null : seller.getAttribute('href');

				let offer = {
					price	:this.amazonParser.getValueSelector(div,'span.olpOfferPrice.a-text-bold')
					,seller	: sellerName
					,shipping	: this.amazonParser.getValueSelector( div,'.olpShippingInfo')
					,condition	: this.amazonParser.getValueSelector(div,'.olpCondition')
					,seller_url	: seller_url
					,time		: this.productUtils.getTime()
					,add2CarSelector : selector
				};


				if( seller_url )
				{
					let params = this.amazonParser.getParameters( seller.getAttribute('href') );

					if( 'seller' in params )
					{
						product.seller_ids.push( params.seller );
						offer.seller_id = params.seller;
					}
				}
				else if( isAmazon )
				{
					offer.seller_id = 'amazon.com';
				}

				let prime = div.querySelector('[aria-label="Amazon Prime TM"]');

				if( prime )
					offer.is_prime = true;


				product.sellers.push( seller.textContent.trim().toLowerCase() );

				product.offers.push( offer );

			}
		});

		return product;
	}
}
