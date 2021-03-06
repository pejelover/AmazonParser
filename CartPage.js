import PromiseUtils from '../Promise-Utils/PromiseUtils.js';

export default class CartPage
{
	constructor(amazonParser, productUtils )
	{
		this.amazonParser = amazonParser;
		this.productUtils = productUtils;
	}


	executeProcessOnItem(asin)
	{

	}

	getSaveForLaterItemsSelector( asin )
	{
		if( asin )
			return '#sc-saved-cart [data-asin="'+asin+'"]:not([data-removed="true"])';

    	return '#sc-saved-cart [data-asin]:not([data-removed="true"])';
	}

	getFirstCartItemAsin()
	{
		let div = this.getCartItemByAsin( null );
		return div === null ? null : div.getAttribute('data-asin');
	}

	moveToCartSaveForLaterProcess( asin )
	{
		if( asin === null )
		{
			let div = this.getSavedForLaterItem( null );

			if( div === null )
				return Promise.reject( 'No Save For Later items found' );

			asin = div.getAttribute('data-asin');
		}

		return PromiseUtils.tryNTimes(()=>
		{
			let nDiv = this.getSavedForLaterItem( asin );

			let input = nDiv.querySelector('input[value="Move to Cart"]');

			if( input )
			{
				input.click();
			}
		},300,14);
	}

	moveToCartSaveForLater( asin )
	{
		let div = this.getSavedForLaterItem( asin );
		if( div === null )
		{
			return;
		}

		let moveToCart = div.querySelector('input[value="Move to Cart"]');

		if( moveToCart )
		{
			moveToCart.click();
		}
	}


	getSavedForLaterProduct( asin )
	{
		let item = this.getSavedForLaterItem( asin );

		if( item !== null )
			return this.parseProductItem( item );

		return null;
	}

	getSavedForLaterItem( asin )
	{
		return document.querySelector( this.getSaveForLaterItemsSelector( asin ) );
	}

	removeSavedForLater( asin )
	{
		//B015TB2LY2
		// '#sc-saved-cart [data-asin="B015TB2LY2"]' ));
		let div= document.querySelector( this.getSaveForLaterItemsSelector( asin ) );

		let input = div.querySelector('span.sc-action-delete>span input');

		if( input )
		{
			input.click();
			return true;
		}

		//Send Product to database
		let x = div.querySelector('span.sc-action-delete>span');

		if( x )
		{
			x.click();
			return true;
		}

		return false;
		//waitTillElementReady
	}

	getCartItemByAsin( asin )
	{
		let form = document.querySelector('#activeCartViewForm');
		let div	= form.querySelector( this.getItemsSelector( asin ) );
		return div;
	}

	removeItemByAsin( asin )
	{
		let form = document.querySelector('#activeCartViewForm');
		let div	= form.querySelector( this.getItemsSelector( asin ) );
		let input = div.querySelector('span.sc-action-delete>span input');

		if( input )
		{
			input.click();
			return true;
		}

		//Send Product to database
		let x = div.querySelector('span.sc-action-delete>span');

		if( x )
		{
			x.click();
			return true;
		}
		return false;
	}

	getLastCartItemAsin()
	{
        let form = document.querySelector('#activeCartViewForm');
        let divs = form.querySelectorAll( this.getItemsSelector( null ) );

        if( divs.length  == 0 )
        {
            return null;
        }

        return divs[ divs.length-1 ].getAttribute('data-asin');
    }

	parseLastItem()
	{
		let form = document.querySelector('#activeCartViewForm');

		if( form )
		{
			let items	= form.querySelectorAll( this.getItemsSelector( null ) );

			if( items.length === 0 )
				return null;

			return this.parseProductItem( items[ items.length - 1 ] );
		}

		return null;
	}

	parseFirstItem()
	{
		let form = document.querySelector('#activeCartViewForm');

		if( form )
		{
			let item	= form.querySelector( this.getItemsSelector( null ) );

			if( item === null )
				return null;

			return this.parseProductItem( item );
		}

		return null;
	}

	getSaveForLaterCount()
	{
		let saveForLater = document.querySelector('#sc-saved-cart .sc-list-head h2>.sc-list-caption');
		if( saveForLater )
		{
			let text = saveForLater.textContent.trim();
			if( /Saved for later \(\d+ items?\)/.test( text ) )
			{
				let x = text.replace( /\D/g, '');
				let aint = parseInt( x, 10 );

				return isNaN( aint ) ? 0 : aint;
			}
		}
		return 0;
	}

	deleteItemsWithStock( products )
	{
		let p = Array.isArray( products ) ? products : this.getProducts();

		let pWithStock = p.filter( i => i.stock.length> 0 );

		let generator = (product, index)=>
		{
			let selector = 'div[data-asin="'+product.asin+'"]  span.sc-action-delete>span';
			//console.log( selector );
			let input  = document.querySelector( selector );

			if( input )
			{
				input.click();
			}

			return PromiseUtils.resolveAfter(1, 500 );
		};

		return PromiseUtils.runSequential( pWithStock, generator );
	}

	parseProductItem( i )
	{
		//console.log( i );

		let product		= this.productUtils.createNewProductObject();
		product.asin	= i.getAttribute('data-asin');

		let link	= i.querySelector('a.sc-product-link');
		let shipped	= i.querySelector('.sc-seller');

		let fullfilled_by	= null;

		let seller	= i.querySelector('.sc-seller a');

		if( seller )
			product.sellers.push( seller.textContent.trim().toLowerCase() );

		let shippedText = this.amazonParser.getValueSelector(i,'.sc-seller');

		if(shipped && /Shipped from: /.test(  shippedText ) && seller )
		{
			fullfilled_by = seller.textContent.trim();
		}

		let params  = new Map();

		if( link )
		{
			product.url	= link.getAttribute('href');
			params	= this.amazonParser.getParameters( product.url );
		}

		let warningMessage  = i.querySelector('.sc-quantity-update-message>.a-box.a-alert');
		let stock = null;

		if( warningMessage )
		{
			let text	= warningMessage.textContent.trim().replace(/\s+/g,' ');
			text 		= text.replace(/^only (\d+) left in stock.*$/i,'$1');
			text		= text.replace(/^This seller has only (\d+) of these available. *$/,'$1');

			let stock	= {
				qty		: this.productUtils.getQty( text )
				,date	: this.productUtils.getDate()
				,time	: this.productUtils.getTime()
				,asin	: product.asin
			};

			if( params.has( 'smid' ) )
			{
				stock.seller_id =  params.get('smid');
			}

			if( 'seller' in product )
			{
				stock.seller		= product.sellers[0];
				stock.seller_url	= seller.getAttribute('href');
			}

			product.stock = [ stock ];
		}



		let qtyStr 	= this.amazonParser.getValueSelector(i,'.sc-product-scarcity');

		if( qtyStr && /^Only (\d+) left in stock/.test( qtyStr ) )
		{
			let stock	= {
				qty	: qtyStr.replace(/^only (\d+) left in stock.*$/i,'$1')
				,date	: this.productUtils.getDate()
				,time	: this.productUtils.getTime()
				,asin	: product.asin
			};

			if( 'seller' in product )
			{
				stock.seller		= product.sellers[0];
				stock.seller_url	= seller.getAttribute('href');
			}

			if( params.has( 'smid' ) )
			{
				stock.seller_id		= params.get('smid');
			}

			product.stock = [ stock ];
		}

		if( product.stock.length == 0 )
		{
			let qtyString = i.getAttribute('data-quantity');
			let qtyInt = parseInt( qtyString, 10 );

			if( !isNaN( qtyInt ) && qtyInt > 20 )
			{
				let stock	= {
					qty	: qtyInt
					,date	: this.productUtils.getDate()
					,time	: this.productUtils.getTime()
					,asin	: product.asin
				};

				if( 'seller' in product )
				{
					stock.seller		= product.sellers[0];
					stock.seller_url	= seller.getAttribute('href');
				}

				if( params.get('smid') )
				{
					stock.seller_id		= params.get( 'smid' );
				}

				product.stock = [ stock ];
			}
		}


		if( product.stock.length )
		{
			if( fullfilled_by )
			{
				product.stock[0].fullfilled_by = fullfilled_by;
				product.stock[0].is_prime = false;
			}
			else
			{
				product.stock[0].is_prime = true;
			}
		}

		let price = this.amazonParser.getValueSelector(i,'span.sc-product-price');

		if( price )
		{

			if( product.stock.length  )
				product.stock[0].price = price;

			let offer = {
				price	: price
				,date	: this.productUtils.getDate()
				,time	: this.productUtils.getTime()
				,asin	: product.asin
			};

			if( fullfilled_by )
			{
				offer.fullfilled_by = fullfilled_by;
			}
			else
			{
				offer.is_prime = true;
			}

			if( 'seller' in product )
			{
				offer.seller		= product.seller;
				offer.seller_url	= seller.getAttribute('href');
			}

			if( params.has( 'smid' ) )
			{
				offer.seller_id = params.get( 'smid' );
			}

			product.offers = [ offer ];
		}

		return product;
	}

	getItemsSelector( asin )
	{
		if( asin )
		{
			return '.sc-list-body[data-name="Active Items"] div[data-asin="'+asin+'"]:not([data-removed="true"]),.sc-batches-list-body[data-name="Active Batches"] div[data-asin="'+asin+'"]:not([data-removed="true"])';
		}

		return '.sc-list-body[data-name="Active Items"] div[data-asin]:not([data-removed="true"]),.sc-batches-list-body[data-name="Active Batches"] div[data-asin]:not([data-removed="true"])';
	}

	getProducts()
	{
		let form = document.querySelector('#activeCartViewForm');
		if( form === null )
			return [];

		let itemsNodeList = form.querySelectorAll( this.getItemsSelector( null ) );
		let items	= Array.from( itemsNodeList );
		let productsArray	= [];

		items.forEach((i)=> productsArray.push( this.parseProductItem( i ) ) );

		return productsArray;
	}

	parseItemProcess( asin )
	{

		return PromiseUtils.tryNTimes(()=>
		{
			let div = this.getCartItemByAsin( asin );
			let z = div.querySelector('[data-action="a-dropdown-button"]');

			if( z )
				z.click();

			let dropdown = div.querySelector('span.a-dropdown-prompt');

			return dropdown === null ? false : dropdown;
		},250,18)
		.then(( dropdown )=>
		{
			return PromiseUtils.tryNTimes(()=>
			{
				dropdown.click();
				let popup = Array.from( document.querySelectorAll('div.a-popover.a-dropdown-common[aria-hidden="false"] li a') );
				let good = popup.find(i=>i.textContent.trim() ==='10+' );

				return good === undefined ? false : good;

			},300, 15 );
		})
		.then(( popup )=>
		{
			return PromiseUtils.tryNTimes(()=>
			{
				popup.click();
				let div = this.getCartItemByAsin( asin );
				let input = div.querySelector('input[name="quantityBox"][aria-label="Quantity"]');
				return input === null ? false : input;
			},350,14);
		})
		.then((input)=>
		{
			return PromiseUtils.tryNTimes(()=>
			{
				input.value = 999;
				let inputEvent = new Event('input',
				{
					"bubbles"	   : true
					,"cancelable"   : false
					,"composed"	 : false
				});

				input.dispatchEvent( inputEvent );

				let div = this.getCartItemByAsin( asin );
				let updateButton = div.querySelector('a[data-action="update"]:not(.sc-link-disabled)');
				return updateButton === null ? false : updateButton;
			},250,12);
		})
		.then((updateButton)=>
		{
			updateButton.click();
			return PromiseUtils.tryNTimes(()=>
			{
				//let div = this.getCartItemByAsin( asin );
				//let asin = div.getAttribute('data-asin');
				let sel = this.getItemsSelector( asin );
				let nDiv = document.querySelector( sel );
				let it = this.parseProductItem( nDiv );

				return it.stock.length > 0 ? it : false;

			},500,7);
		});
	}
}
