export const htmlTemplate = (abTestFont) => `
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />

		<title>A simple, clean, and responsive HTML invoice template</title>

		${
      abTestFont === "exo2"
        ? `
					<link rel="preconnect" href="https://fonts.googleapis.com">
					<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
					<link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400..700&family=Exo+2:ital,wght@0,100..900;1,100..900&family=Gloria+Hallelujah&family=Playwrite+TZ+Guides&display=swap" rel="stylesheet">`
        : ""
    }

		${
      abTestFont === "gloria"
        ? `
					<link rel="preconnect" href="https://fonts.googleapis.com">
					<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
					<link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400..700&family=Gloria+Hallelujah&family=Playwrite+TZ+Guides&display=swap" rel="stylesheet">`
        : ""
    }

    {{{ cssStyles }}}

	</head>

	<body>
		<h1>A simple, clean, and responsive HTML invoice template</h1>
		<h3>Because sometimes, all you need is something simple.</h3>
		<div class="invoice-box">
			<table>
				<tr class="top">
					<td colspan="2">
						<table>
							<tr>
								<td class="title">
                  {{{ logo }}}
								</td>

								<td>
									Invoice #: {{ invoiceNumber }}<br />
									Created: {{ createdDate }}<br />
									Due: {{ dueDate }}
								</td>
							</tr>
						</table>
					</td>
				</tr>

				<tr class="information">
					<td colspan="2">
						<table>
							<tr>
								<td>
                  Duff Breweries<br />
									Unit C, 15/F<br />
									Springfield, United States.
								</td>

								<td>
									{{ recipientAddress.name }}<br />
									{{ recipientAddress.address1 }}<br />
									{{ recipientAddress.address2 }}
								</td>
							</tr>
						</table>
					</td>
				</tr>

				<tr class="heading">
					<td>Payment Method</td>

					<td>Check #</td>
				</tr>

				<tr class="details">
					<td>{{ paymentMethod }}</td>

					<td>{{ paymentId }}</td>
				</tr>

				<tr class="heading">
					<td>Item</td>

					<td>Price</td>
				</tr>

        {{#each items}}
          <tr class="item">
					<td>{{ this.description }}</td>

					<td>\${{ this.price }}</td>
				</tr>
        {{/each}}

				<tr class="total">
					<td></td>

					<td>Total: {{ totalPrice }}</td>
				</tr>
			</table>
		</div>
	</body>
</html>`;
