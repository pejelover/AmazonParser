class ProductUtils
{
	constructor( options )
	{
		this.date	= new Date();
		this.date.setSeconds( 0 );
		this.date.setMilliseconds( 0 );
	}

	createNewProductObject()
	{
		return {

			images	: []
			,offers	: []
			,sellers : []
			,seller_ids: []
			,search		: []
			,stock	: []
			,parsed	: this.date.toISOString()
			,parsedDates:[ this.getDateString( this.date ) ]
			,versions	: []
		};
	}



	getDate()
	{
		return this.getDateString( this.date );
	}

	getTime()
	{
		return this.date.toISOString();
	}


	getDateString( date )
	{
		let fl = (i)=> i<10 ? '0'+i : i;
		let dateStr = date.getFullYear()+'-'+fl( date.getMonth()+1 )+'-'+fl( date.getDate() );

		return dateStr;
	}

	mergeProducts( op, np )
	{
		let isOpOldProduct = true;

		if('parsed' in op && 'parsed' in np && op.parsed > np.parsed )
		{
			isOpOldProduct = false;
		}

		let oldProduct =  isOpOldProduct ? op : np;
		let newProduct =  isOpOldProduct ? np : op;

		let keys = Object.keys( oldProduct );

		let arraysKeys	= {
			'offers'		:false
			,'stock'		:false
			,'merchants'	:false
			,'search'		:true
			,'sellers'		:true
			,'parsedDates'	:true
			,'seller_ids'	:true
		};

		keys.forEach((k)=>
		{
			if( k in arraysKeys )
			{
				if( arraysKeys[ k ] )
				{
					this.overlapingInfo( oldProduct[ k ], newProduct[ k ], null, (element,isOverlap )=>
					{
						if( !isOverlap )
							newProduct[ k ].push( element );
					});
				}
				return;
			}

			if( (k in newProduct && newProduct[ k ] ) || k in arraysKeys  )
				return;

			newProduct[ k ] = oldProduct[ k ];
		});

		if( !('stock' in newProduct) )
			newProduct.stock = [];

		if( !('stock' in oldProduct) )
			oldProduct.stock = [];



		let pKGenerator = (stock)=>
		{
			let k = "";

			if( 'time' in stock )
			{
				k+="_"+stock.time.substring(0,15);
			}

			if( 'qty' in stock )
				k = stock.qty;

			if( "seller_id" in stock )
				k+="_"+stock.seller_id;

			return k;
		};


		let sK = {};

		let joiner = ( stock )=>
		{
			let  k = pKGenerator( stock );
			sK[ k ] = stock;
		};

		oldProduct.stock.forEach( joiner );
		newProduct.stock.forEach( joiner );

		newProduct.stock = Object.values( sK );

		if( !( 'offers' in newProduct ) )
			newProduct.offers = [];

		if( !('offers' in oldProduct)  )
			oldProduct.offers = [];


		let offerGenerator = (offer)=>
		{
			let k = '';
			if( 'time' in offer )
			{
				k += offer.time.substring(0,13);
			}
			if( 'seller_id' in offer && offer.seller_id )
			{
				k+= offer.seller_id;
			}
			if( 'price' in offer )
				k+= offer.price;

			return k;
		};

		let offersKeys = {};

		let offersJoiner = (offer)=>
		{
			let k = offerGenerator( offer );
			offersKeys[ k ] = offer;
		};

		oldProduct.offers.forEach( offersJoiner );
		newProduct.offers.forEach( offersJoiner );
		newProduct.offers = Object.values( offersKeys );

		return newProduct;
	}

	cleanProductNormalize( product )
	{
		if( !('seller_ids' in product)  )
			product.seller_ids = [];

		if( 'offers' in product )
		{
			if( !('sellers' in product ) )
			{
				product.sellers = [];
			}


			product.offers.forEach((offer )=>
			{
				if( 'add2CarSelector' in offer )
				{
					delete offer.add2CarSelector;
				}

				if( 'seller' in offer )
				{
					product.sellers.push( offer.seller.toLowerCase() );
				}
				if( 'seller_id' in offer )
				{
					product.seller_ids.push( offer.seller_id );
				}
			});
		}

		if( 'rating' in product && /Be the first to review this item/.test( product.rating ) )
		{
			product.rating	 = 5;
			product.number_of_ratings = 0;
		}

		if( 'seller_ids' in product )
		{
			let kSellers = {};
			product.seller_ids.forEach(i=>kSellers[i]=1);
			product.seller_ids = Object.keys( kSellers );
		}

		if( 'sellers' in product )
		{
			let kSellers = {};
			product.sellers.forEach(i=>kSellers[i]=1);
			product.sellers = Object.keys( kSellers );
		}

		if( 'qids' in product )
		{
			delete product.qids;
		}

		if( !( 'offers' in product) )
			product.offers  = [];

		if( 'time' in product )
		{
			if( 'parsed' in product )
			{
				product.parsed = product.time;
				delete product.time;
			}
		}

		if( 'dateParsed' in product )
		{
			if( !( 'parsed' in product ) )
			{
				let x = new Date( product.dateParsed );
				product.parsed = x.toISOString();
			}

			delete product.dateParsed;
		}

		if( 'stock' in product )
		{
			product.stock.forEach((stock)=>
			{
				stock.qty = this.getQty( stock.qty );
			});
		}
		else
		{
			product.stock = [];
		}
	}

	getQty( qty )
	{

		if( qty == null  || qty === undefined )
			return '';

		let msg = /The item quantities were not updated since you've exceeded the maximum number of items that can be stored in the Shopping Cart/;

		if(  msg.test( qty) )
		{
			return 'Error > 990';
		}

		let regex_2 = /This seller has only \d+ of these available. To see if more are available from another seller, go to the product detail page./;
		let regex_2_replace = /This seller has only (\d+) of these available. To see if more are available from another seller, go to the product detail page./;
		let regex_3 = /Only \d+ left in stock \(more on the way\)./;

		let regex_3_replace = /Only (\d+) left in stock \(more on the way\)/;

		if( qty === 'Currently unavailable.' )
		{
			return 0;
		}
		if( /^\d+$/.test( qty ) )
		{
			return qty;
		}
		if( /Only \d+ left in stock - order soon./.test( qty ) )
		{
			return qty.replace(/.*Only (\d+) left in stock - order soon.*/,'$1');
		}
		if( regex_2.test( qty ) )
		{
			return qty.replace( regex_2_replace, '$1' );
		}
		if( regex_3.test( qty ) )
		{
			 return qty.replace( regex_3_replace, '$1' );
		}

		return qty;
	}

	overlapingInfo( from, to,key ,lambda )
	{
		if( !from || !to  )
			return;

		let aKeys	= {};

		let isFunc  = typeof key === "function";

		if( key == null )
		{
			to.forEach( i => aKeys[ i ] = 1 );

			from.forEach((i)=>
			{
				lambda( i, i in aKeys );

			});
		}
		else
		{
			to.forEach((i)=>
			{
				aKeys[ isFunc ? key( i ) : to[ key ] ] = i;
			});

			from.forEach((i)=>
			{
				let bKey = isFunc ? key( i ) : from[ key ];
				lambda( i, bKey in aKeys );
			});
		}
	}

}
