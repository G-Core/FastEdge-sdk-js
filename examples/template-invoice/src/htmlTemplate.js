export const htmlTemplate = () => `
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />

		<title>A simple, clean, and responsive HTML invoice template</title>

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
                  {{{ logoBrand }}}
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
