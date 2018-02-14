math.import({
	Inv: function (M, n=0) {
		if (n==0) {
			if (math.det(M) == 0) {
				throw 'error det = 0';
			}
			return math.inv(M);
		}
        if (math.Det(M,n) == 0) {
			throw 'error det = 0';
        }
        
        var A = math.clone(M);
        var size = A.length;
        var I = math.eye(size)._data;
        for (var t = 0; t < 2; t++) {
            for (var i = 0; i < size - 1; i++) {
                //swap to have a leading 1
                if (A[i][i] != 1) {
                    for (var j = i + 1; j < size; j++) {
                        if (A[j][i] == 1) {
                            A.swap(i, j);
                            I.swap(i, j);
                            break;
                        }
                    }
                }
                //row operations
                for (var k = i + 1; k < size; k++) {
                    if (A[k][i] == 1) {
                        A[k] = math.mod(math.add(A[k], A[i]), n);
                        I[k] = math.mod(math.add(I[k], I[i]), n);
                    }
                }
            }

            for (var i = size - 1; i > 0; i--) {
                for (var k = i - 1; k >= 0; k--) {
                    if (A[k][i] == 1) {
                        A[k] = math.mod(math.add(A[k], A[i]), n);
                        I[k] = math.mod(math.add(I[k], I[i]), n);
                    }
                }
            }
        }
        return I;
    },

	Rand: function (size, n=0) {
		if (n == 0) {
			return math.floor(math.random([size, size], 0, 2));
		}
		console.log(size);
        return math.floor(math.random([size, size], 0, n));
    },

    RandomBasis: function (size, n=0) {
		var mat;
        do {
            mat = math.Rand(size, n);
        } while (math.Det(mat,n) == 0);
        return mat;
    },

    TransitionMatrix: function (A, B, n=0) {
        return math.mod(math.multiply(math.Inv(A,n),B),n);
    },

	Det: function (A, n=0) {
        return math.mod(math.det(A), n);
    }

});

