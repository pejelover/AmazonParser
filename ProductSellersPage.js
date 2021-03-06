export default class ProductSellersPage
{
	constructor(amazonParser, productUtils )
	{
		this.amazonParser = amazonParser;
		this.productUtils = productUtils;
	}

	addToCartBySellerId( seller_id, is_one_day_shipping, fullfilled_by_vendor, fullfilled_by_amazon )
	{
		let searchSeller = seller_id === 'ATVPDKIKX0DER' ? 'amazon.com' : seller_id;

		let product = this.getProduct();

		let offer	= product.offers.find( (offer) =>{


			if( !('seller_id' in offer ) || offer.seller_id != searchSeller )
			{
				return false;
			}

			if( fullfilled_by_vendor && 'fullfilled_by' in offer && offer.fullfilled_by === 'Amazon.com' )
			{
				return false;
			}

			if( fullfilled_by_amazon && ( !('fullfilled_by' in offer ) || offer.fullfilled_by != 'Amazon.com' ) )
			{
				return false;
			}

			if( is_one_day_shipping &&  !('is_one_day' in  offer ) && offer.is_one_day )
			{
				return false;
			}

			return true;
		});


		if( offer !== undefined && 'add2CarSelector' in offer && offer.add2CarSelector )
		{
			let ele = document.querySelector( offer.add2CarSelector );

			if( ele )
			{
				ele.click();
				return true;
			}

			return false;
		}
		return false;
	}

	addToCartFirstPrime()
	{
		let product = this.getProduct();
	 	for(let i=0;i <product.offers.length;i++)
		{
			if( product.offers[ i ].is_prime )
			{
				if( this.addToCartBySellerId( product.offers[ i ].seller_id ) )
					return true;
			}
		}

		return false;
	}

	addToCartFirstSeller()
	{
		//let divs = document.querySelector('#olpOfferList div[role="row"].olpOffer input[value="Add to cart"]').click();
		let input = document.querySelector('#olpOfferList div[role="row"].olpOffer input[value="Add to cart"]');
		if( input )
		{
			input.click();
			return true;
		}
		return false;
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

				let attr = null;

				let input = div.querySelector('input[type="submit"]');
				if( input  )
					attr = input.getAttribute('aria-labelledby');

				if( attr == null )
					console.log("IS NULL", input );

				let isAmazon = seller.tagName == 'IMG' && seller.getAttribute("alt") === 'Amazon.com';

				let selector = attr ===  null ? null : 'input[type="submit"][aria-labelledby="'+attr+'"]';

				let sellerName = isAmazon ? 'amazon.com' : seller.textContent;
				let seller_url	= seller.tagName === 'IMG' ? null : seller.getAttribute('href');

				let offer = {
					price	:this.amazonParser.getValueSelector(div,'span.olpOfferPrice.a-text-bold')
					,asin	: product.asin
					,seller	: sellerName
					,shipping	: this.amazonParser.getValueSelector( div,'.olpShippingInfo')
					,condition	: this.amazonParser.getValueSelector(div,'.olpCondition')
					,seller_url	: seller_url
					,time		: this.productUtils.getTime()
					,add2CarSelector : selector
				};

				let fullfilled_by_amazon = div.querySelector('.olpFbaPopoverTrigger');

				if( fullfilled_by_amazon )
				{
					offer.fullfilled_by = 'Amazon.com';
				}

				let days = div.querySelector('[id^="shippingMessage_ftinfo_olp_"] b');

				if( days )
				{
					let text = days.textContent.trim();

					if( text === 'One-Day Shipping' )
					{
						offer.is_one_day = true;
					}
					else if( text === 'Two-Day Shipping' )
					{
						offer.is_two_day = true;
					}
				}


				if( /shipped by Amazon/.test( offer.shipping ) )
				{
					offer.fullfilled_by = 'Amazon.com';
				}


				if( seller_url )
				{
					let params = this.amazonParser.getParameters( seller.getAttribute('href') );

					if( params.has('seller') )
					{
						product.seller_ids.push( params.get( 'seller' ) );
						offer.seller_id = params.get('seller');
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

	isFirstPage()
	{
		let div = document.querySelector('#olpOfferListColumn ul.pagination');
		if( div )
			return false;

		return true;
	}

	getNextPageSelector()
	{
		return '#olpOfferListColumn ul.a-pagination>li.a-last>a';
	}

	hasPrevPage()
	{
		return false;
	}
	hasNextPage()
	{
		let nextButton = document.querySelector( this.getNextPageSelector() );
		return nextButton !== null;
	}

	goToNextPage()
	{
		let nextButton = document.querySelector( this.getNextPageSelector() );
		if( nextButton )
		{
			nextButton.click();
			return true;
		}
		return false;
	}
}
